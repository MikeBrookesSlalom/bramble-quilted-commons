import * as THREE from 'three';
import { World } from './level.js';
import { createBear, animateBear, bearLandSquash } from './bear.js';
import { skyTexture } from './textures.js';
import { Particles } from './particles.js';
import { Sound } from './sound.js';

const GRAVITY = 30;
const FALL_GRAVITY = 46;
const JUMP_V = 13.2;
const FLUTTER_V = 10.6;
const MAX_SPEED = 7.2;
const ACCEL_GROUND = 52;
const ACCEL_AIR = 26;
const FRICTION = 14;
const PLAYER_R = 0.42;
const PLAYER_H = 1.55;

export class Game {
  constructor(canvas, ui) {
    this.ui = ui;
    this.clock = new THREE.Clock();
    this.time = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    const sky = skyTexture();
    this.scene.background = sky;
    this.sky = sky;
    this.scene.fog = new THREE.FogExp2(0xe4eef5, 0.0028);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);
    this.setupLights();

    this.world = new World(this.scene);
    // only the metalware reflects the sky — the fabrics stay matte
    for (const key of ['metal', 'gold']) {
      const m = this.world.mat[key];
      m.envMap = this.sky;
      m.envMapIntensity = 0.9;
      m.needsUpdate = true;
    }
    this.particles = new Particles(this.scene);
    this.sound = new Sound();

    this.bear = createBear();
    this.scene.add(this.bear);

    this.pos = new THREE.Vector3(0, 0.2, 6);
    this.vel = new THREE.Vector3();
    this.facing = Math.PI;
    this.grounded = false;
    this.groundCol = null;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.canFlutter = true;
    this.cutJump = false;
    this.respawnPos = this.pos.clone();
    this.collected = 0;
    this.won = false;
    this.winTime = 0;
    this.started = false;

    this.yaw = 0;          // camera behind the bear, looking down the level
    this.pitch = 0.22;
    this.dist = 8.5;
    this.camPos = new THREE.Vector3(0, 4, 14);
    this.camLook = new THREE.Vector3();

    this.keys = new Set();
    this.touchAxis = { x: 0, z: 0 };   // virtual joystick, -1..1 per axis
    this.bindInput(canvas);
    this.onResize();
    addEventListener('resize', () => this.onResize());

    this.ui.setTotal(this.world.buttons.length);
    this.ui.setCount(0);
  }

  setupLights() {
    const sun = new THREE.DirectionalLight(0xfff6e8, 2.0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = 34;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 140;
    sun.shadow.bias = -0.0012;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;

    this.scene.add(new THREE.HemisphereLight(0xdff0ff, 0xf3ddc4, 0.95));
    const fill = new THREE.DirectionalLight(0xd8ecff, 0.45);
    fill.position.set(-12, 8, -14);
    this.scene.add(fill);
  }

  /* ---------------- input ---------------- */

  bindInput(canvas) {
    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space') this.jumpBuffer = 0.16;
      if (e.code === 'KeyR') this.respawn();
      this.ui.hideHintOnce();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    // One finger drags the camera; two fingers pinch to zoom. Mouse still
    // requests pointer lock so desktop players get frictionless look-around;
    // touch never does, since iPadOS doesn't support it and it isn't needed
    // — the on-screen joystick and jump button live in their own DOM layer
    // above the canvas, so their touches never reach these handlers at all.
    const pointers = new Map();
    let pinchStartDist = null, pinchStartCamDist = null;
    const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    canvas.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // capture can throw in edge cases (already-released pointer, some
      // iOS Safari timing quirks) — never let that skip the state below
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      if (e.pointerType === 'mouse' && this.started && document.pointerLockElement !== canvas) {
        const req = canvas.requestPointerLock?.();
        if (req && req.catch) req.catch(() => {});
      }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStartDist = dist2(a, b);
        pinchStartCamDist = this.dist;
      }
    });
    const endPointer = (e) => {
      pointers.delete(e.pointerId);
      try { canvas.releasePointerCapture?.(e.pointerId); } catch {}
      if (pointers.size < 2) pinchStartDist = null;
    };
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);

    addEventListener('pointermove', (e) => {
      const locked = document.pointerLockElement === canvas;
      if (locked) {
        this.yaw -= e.movementX * 0.0032;
        this.pitch = THREE.MathUtils.clamp(this.pitch + e.movementY * 0.0026, -0.5, 1.05);
        return;
      }
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      const cur = { x: e.clientX, y: e.clientY };

      if (pointers.size === 2) {
        pointers.set(e.pointerId, cur);
        const [a, b] = [...pointers.values()];
        if (pinchStartDist) {
          const d = dist2(a, b);
          this.dist = THREE.MathUtils.clamp(pinchStartCamDist * (pinchStartDist / d), 4.5, 16);
        }
        return;
      }

      pointers.set(e.pointerId, cur);
      this.yaw -= (cur.x - prev.x) * 0.0032;
      this.pitch = THREE.MathUtils.clamp(this.pitch + (cur.y - prev.y) * 0.0026, -0.5, 1.05);
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.dist = THREE.MathUtils.clamp(this.dist + e.deltaY * 0.008, 4.5, 16);
    }, { passive: false });
  }

  // driven by the on-screen joystick — x is left/right, z is forward/back
  setMoveAxis(x, z) {
    this.touchAxis.x = Math.abs(x) < 0.08 ? 0 : x;
    this.touchAxis.z = Math.abs(z) < 0.08 ? 0 : z;
  }

  pressJump() {
    this.keys.add('Space');
    this.jumpBuffer = 0.16;
    this.ui.hideHintOnce();
  }

  releaseJump() {
    this.keys.delete('Space');
  }

  start() {
    this.started = true;
    this.sound.enable();
    this.clock.getDelta();
  }

  /* ---------------- collision ---------------- */

  // player is treated as an upright box of half-width PLAYER_R
  overlapsY(col, feet) {
    const top = col.pos.y + this.colHalfY(col);
    const bottom = col.pos.y - this.colHalfY(col);
    return feet < top - 0.001 && feet + PLAYER_H > bottom + 0.001;
  }

  colHalfY(col) {
    return col.type === 'box' ? col.half.y : col.height / 2;
  }

  overlapsXZ(col, x, z) {
    if (col.type === 'box') {
      return Math.abs(x - col.pos.x) < col.half.x + PLAYER_R &&
             Math.abs(z - col.pos.z) < col.half.z + PLAYER_R;
    }
    const dx = x - col.pos.x, dz = z - col.pos.z;
    const rr = col.radius + PLAYER_R;
    return dx * dx + dz * dz < rr * rr;
  }

  // Every platform is one-way: you sail up through it and land on top.
  // Nothing in this world blocks you sideways or bonks you on the head —
  // it keeps the climb forgiving for small hands.
  resolveVertical(prevFeet, wasGrounded) {
    const p = this.pos;
    let landed = null;
    for (const col of this.world.colliders) {
      if (!this.overlapsXZ(col, p.x, p.z)) continue;
      const top = col.pos.y + this.colHalfY(col);
      if (this.vel.y <= 0.001 && prevFeet >= top - 0.06 && p.y <= top + 0.001) {
        if (!landed || top > landed.top) landed = { col, top };
      }
    }

    // stay glued to a platform that is sinking beneath us
    if (!landed && wasGrounded && this.vel.y <= 0.01) {
      for (const col of this.world.colliders) {
        if (!this.overlapsXZ(col, p.x, p.z)) continue;
        const top = col.pos.y + this.colHalfY(col);
        if (p.y - 0.3 < top && p.y >= top - 0.45) {
          if (!landed || top > landed.top) landed = { col, top };
        }
      }
    }

    if (landed) {
      const impact = -this.vel.y;
      p.y = landed.top;
      const col = landed.col;
      if (col.bounce) {
        this.vel.y = col.bounce;
        this.grounded = false;
        this.groundCol = null;
        this.canFlutter = true;
        this.cutJump = false;
        this.particles.puff(p.clone(), 22, 0xffd9e6, 3.2);
        this.sound.boing();
        if (col.padCoil) col.padCoil.userData.squish = 1;
        return;
      }
      this.vel.y = 0;
      if (!this.grounded) this.onLand(impact);
      this.grounded = true;
      this.groundCol = col;
      this.coyote = 0.12;
      this.canFlutter = true;
    } else {
      this.grounded = false;
      this.groundCol = null;
    }
  }

  onLand(impact) {
    bearLandSquash(this.bear, impact);
    if (impact > 4) {
      this.particles.puff(this.pos.clone(), Math.min(16, 4 + impact), 0xfff3e4, 1.4);
      this.sound.land(impact);
    }
  }

  /* ---------------- per-frame ---------------- */

  update(dt) {
    this.time += dt;
    this.world.updateMovers(this.time);

    // carried along by whatever we are standing on
    if (this.grounded && this.groundCol?.mover) {
      this.pos.add(this.groundCol.mover.delta);
    }

    this.handleMovement(dt);
    this.handlePickups(dt);
    this.updateProps(dt);
    this.particles.update(dt);

    const speed = Math.hypot(this.vel.x, this.vel.z);
    this.bear.position.copy(this.pos);
    if (speed > 0.4) {
      const target = Math.atan2(this.vel.x, this.vel.z);
      let diff = target - this.facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facing += diff * Math.min(1, dt * 12);
    }
    this.bear.rotation.y = this.facing;
    animateBear(this.bear, dt, { speed, grounded: this.grounded, vy: this.vel.y, time: this.time });

    if (this.pos.y < this.respawnPos.y - 30 || this.pos.y < -20) this.respawn();

    this.updateCamera(dt);

    // keep the shadow frustum around the bear
    this.sun.position.set(this.pos.x + 20, this.pos.y + 34, this.pos.z + 18);
    this.sun.target.position.copy(this.pos);
    this.sun.target.updateMatrixWorld();
  }

  handleMovement(dt) {
    const k = this.keys;
    let ix = 0, iz = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) iz += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) iz -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) ix -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) ix += 1;
    ix += this.touchAxis.x;
    iz += this.touchAxis.z;

    // movement is relative to wherever the camera is looking
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = ix * cos - iz * sin;
    let wz = -ix * sin - iz * cos;
    // clamp to a unit vector rather than always normalizing to one, so a
    // half-tilted joystick still moves at half speed
    const mag = Math.hypot(wx, wz);
    if (mag > 1) { wx /= mag; wz /= mag; }

    const accel = this.grounded ? ACCEL_GROUND : ACCEL_AIR;
    if (mag > 0) {
      this.vel.x += wx * accel * dt;
      this.vel.z += wz * accel * dt;
      const sp = Math.hypot(this.vel.x, this.vel.z);
      if (sp > MAX_SPEED) {
        this.vel.x *= MAX_SPEED / sp;
        this.vel.z *= MAX_SPEED / sp;
      }
      if (this.grounded && Math.random() < dt * 6 * (sp / MAX_SPEED)) {
        this.particles.puff(this.pos.clone(), 1, 0xfff6ea, 0.7);
      }
    } else if (this.grounded) {
      const damp = Math.max(0, 1 - FRICTION * dt);
      this.vel.x *= damp;
      this.vel.z *= damp;
    }

    // jumping, with a little coyote time and input buffering
    this.coyote = Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer > 0) {
      if (this.grounded || this.coyote > 0) {
        this.vel.y = JUMP_V;
        this.grounded = false;
        this.groundCol = null;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.cutJump = true;
        this.particles.puff(this.pos.clone(), 8, 0xffffff, 1.1);
        this.sound.jump();
      } else if (this.canFlutter) {
        this.vel.y = FLUTTER_V;
        this.canFlutter = false;
        this.jumpBuffer = 0;
        this.cutJump = true;
        this.particles.puff(this.pos.clone(), 14, 0xd9f0ff, 1.8);
        this.sound.flutter();
      }
    }
    // shorter hop if the key is let go early (springs are exempt)
    if (this.cutJump && !this.keys.has('Space') && this.vel.y > 4) this.vel.y -= 16 * dt;

    this.vel.y -= (this.vel.y > 0 ? GRAVITY : FALL_GRAVITY) * dt;
    this.vel.y = Math.max(this.vel.y, -42);

    // integrate in small steps so nothing tunnels through a platform
    const move = new THREE.Vector3(this.vel.x * dt, this.vel.y * dt, this.vel.z * dt);
    const steps = Math.min(8, Math.ceil(move.length() / 0.22) || 1);
    const wasGrounded = this.grounded;
    for (let i = 0; i < steps; i++) {
      this.pos.x += move.x / steps;
      this.pos.z += move.z / steps;
      const prevFeet = this.pos.y;
      this.pos.y += move.y / steps;
      this.resolveVertical(prevFeet, wasGrounded && this.vel.y <= 0);
      if (this.vel.y === 0 || this.grounded) move.y = this.vel.y * dt;
    }
  }

  handlePickups(dt) {
    for (const b of this.world.buttons) {
      if (b.taken) continue;
      b.group.rotation.y += dt * 1.6;
      b.group.rotation.z = Math.sin(this.time * 2 + b.home.x) * 0.25;
      b.group.position.y = b.home.y + Math.sin(this.time * 2.2 + b.home.z) * 0.18;
      if (b.group.position.distanceTo(this.pos.clone().setY(this.pos.y + 0.8)) < 1.35) {
        b.taken = true;
        b.group.visible = false;
        this.collected++;
        this.ui.setCount(this.collected);
        this.particles.sparkle(b.group.position.clone(), 26);
        this.sound.collect(this.collected);
      }
    }

    for (const cp of this.world.checkpoints) {
      cp.group.rotation.y += dt * (cp.active ? 1.1 : 0.3);
      if (!cp.active && cp.pos.distanceTo(this.pos) < 2.6) {
        cp.active = true;
        cp.ribbon.material = new THREE.MeshStandardMaterial({
          color: 0xffd166, emissive: 0x7a5205, emissiveIntensity: 0.6, roughness: 0.7,
        });
        this.particles.sparkle(cp.pos.clone().setY(cp.pos.y + 1), 20);
        this.sound.checkpoint();
        this.ui.toast(`Checkpoint — ${cp.label}`);
      }
      if (cp.active && cp.pos.distanceTo(this.pos) < 3.4) {
        this.respawnPos.copy(cp.pos).add(new THREE.Vector3(0, 0.4, 1.2));
      }
    }

    const goal = this.world.goal;
    goal.group.rotation.y += dt * 0.9;
    goal.group.position.y = 34.8 + Math.sin(this.time * 1.6) * 0.14;
    if (!goal.reached && goal.pos.distanceTo(this.pos) < 2.6) {
      goal.reached = true;
      this.won = true;
      this.winTime = this.time;
      this.particles.confetti(goal.pos.clone(), 220);
      this.sound.fanfare();
      this.ui.win(this.collected, this.world.buttons.length);
    }
  }

  updateProps(dt) {
    for (const col of this.world.colliders) {
      if (col.padCoil && col.padCoil.userData.squish > 0) {
        col.padCoil.userData.squish = Math.max(0, col.padCoil.userData.squish - dt * 3);
        const s = col.padCoil.userData.squish;
        col.padCoil.scale.set(1 + s * 0.3, 1 - s * 0.5, 1 + s * 0.3);
      }
    }
    // a shower of scraps for a few seconds after the thimble is found
    if (this.won && this.time - this.winTime < 9 && Math.random() < dt * 3) {
      this.particles.confetti(this.pos.clone().setY(this.pos.y + 6), 14);
    }
  }

  updateCamera(dt) {
    const target = this.pos.clone().add(new THREE.Vector3(0, 1.35, 0));
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch) + 0.25,
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).multiplyScalar(this.dist);

    let desired = target.clone().add(offset);
    // pull the camera in if a platform is in the way
    const dir = desired.clone().sub(target);
    const len = dir.length();
    dir.normalize();
    for (let t = 0.35; t <= 1; t += 0.1) {
      const sample = target.clone().addScaledVector(dir, len * t);
      let blocked = false;
      for (const col of this.world.colliders) {
        const halfY = this.colHalfY(col) + 0.3;
        if (Math.abs(sample.y - col.pos.y) > halfY) continue;
        if (col.type === 'box') {
          if (Math.abs(sample.x - col.pos.x) < col.half.x + 0.3 &&
              Math.abs(sample.z - col.pos.z) < col.half.z + 0.3) { blocked = true; break; }
        } else {
          const dx = sample.x - col.pos.x, dz = sample.z - col.pos.z;
          if (dx * dx + dz * dz < (col.radius + 0.3) ** 2) { blocked = true; break; }
        }
      }
      if (blocked) {
        desired = target.clone().addScaledVector(dir, Math.max(2.2, len * (t - 0.1)));
        break;
      }
    }

    const lerp = 1 - Math.pow(0.0015, dt);
    this.camPos.lerp(desired, lerp);
    this.camLook.lerp(target, 1 - Math.pow(0.0008, dt));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  respawn() {
    this.particles.puff(this.pos.clone(), 10, 0xffffff, 1.2);
    this.pos.copy(this.respawnPos);
    this.vel.set(0, 0, 0);
    this.grounded = false;
    this.canFlutter = true;
    this.camPos.copy(this.pos).add(new THREE.Vector3(0, 3, 8));
    this.sound.respawn();
  }

  onResize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 1 / 25);
    if (this.started) this.update(dt);
    else {
      this.time += dt;
      this.world.updateMovers(this.time);
      // slow orbit over the meadow behind the title card
      const a = this.time * 0.12;
      this.camera.position.set(Math.sin(a) * 18, 7 + Math.sin(a * 0.7) * 2, 6 + Math.cos(a) * 18);
      this.camera.lookAt(0, 2.2, 2);
      this.bear.position.copy(this.pos);
      animateBear(this.bear, dt, { speed: 0, grounded: true, vy: 0, time: this.time });
      this.particles.update(dt);
    }
    this.render();
  };
}
