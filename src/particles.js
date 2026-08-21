import * as THREE from 'three';

/* Soft bursts of lint, fabric flecks and confetti scraps. */

const MAX = 900;

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();
  // a few stray fibres so the flecks read as fluff, not sparks
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Particles {
  constructor(scene) {
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.siz = new Float32Array(MAX);
    this.data = Array.from({ length: MAX }, () => ({
      life: 0, max: 1, vel: new THREE.Vector3(), grav: -6, flutter: 0, spin: 0, size: 1,
    }));
    this.next = 0;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.siz, 1));

    // a tiny custom shader so every fleck can fade at its own size
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: dotTexture() } },
      vertexShader: `
        attribute float size;
        varying vec3 vColorOut;
        void main() {
          vColorOut = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 900.0 / max(1.0, -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map;
        varying vec3 vColorOut;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          if (tex.a < 0.03) discard;
          gl_FragColor = vec4(vColorOut, tex.a);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      vertexColors: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.geo = geo;
    for (let i = 0; i < MAX; i++) this.pos[i * 3 + 1] = -9999;
  }

  spawn(p, vel, color, life, size, grav = -6, flutter = 0) {
    const i = this.next;
    this.next = (this.next + 1) % MAX;
    const d = this.data[i];
    d.life = life; d.max = life; d.grav = grav; d.flutter = flutter;
    d.spin = Math.random() * 6.28; d.size = size;
    d.vel.copy(vel);
    this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
    const c = new THREE.Color(color);
    this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
    this.siz[i] = size;
  }

  puff(at, count, color = 0xffffff, power = 1.5) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * power;
      this.spawn(
        at.clone().add(new THREE.Vector3(Math.cos(a) * 0.35, 0.15 + Math.random() * 0.3, Math.sin(a) * 0.35)),
        new THREE.Vector3(Math.cos(a) * r, Math.random() * power * 0.8, Math.sin(a) * r),
        color, 0.5 + Math.random() * 0.5, 0.16 + Math.random() * 0.16, -4
      );
    }
  }

  sparkle(at, count) {
    const colors = [0xffd166, 0xfff1c9, 0xffb4c8, 0xbfe6ff];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const up = 1 + Math.random() * 3;
      this.spawn(
        at.clone(),
        new THREE.Vector3(Math.cos(a) * 2.2 * Math.random(), up, Math.sin(a) * 2.2 * Math.random()),
        colors[i % colors.length], 0.7 + Math.random() * 0.6, 0.14 + Math.random() * 0.14, -7
      );
    }
  }

  confetti(at, count) {
    const colors = [0xf6a5bb, 0xa9dcc9, 0xf7dfa5, 0xcbbde8, 0xa8cfe8, 0xf4a48c, 0xffffff];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawn(
        at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 3, (Math.random() - 0.5) * 6)),
        new THREE.Vector3(Math.cos(a) * 3 * Math.random(), 3 + Math.random() * 5, Math.sin(a) * 3 * Math.random()),
        colors[Math.floor(Math.random() * colors.length)],
        2.4 + Math.random() * 2.2, 0.2 + Math.random() * 0.2, -2.4, 1.6
      );
    }
  }

  update(dt) {
    for (let i = 0; i < MAX; i++) {
      const d = this.data[i];
      if (d.life <= 0) continue;
      d.life -= dt;
      if (d.life <= 0) { this.pos[i * 3 + 1] = -9999; this.siz[i] = 0; continue; }
      d.vel.y += d.grav * dt;
      if (d.flutter) {
        d.spin += dt * 5;
        d.vel.x += Math.cos(d.spin) * d.flutter * dt * 4;
        d.vel.z += Math.sin(d.spin * 1.3) * d.flutter * dt * 4;
      }
      this.pos[i * 3] += d.vel.x * dt;
      this.pos[i * 3 + 1] += d.vel.y * dt;
      this.pos[i * 3 + 2] += d.vel.z * dt;
      this.siz[i] = d.size * Math.min(1, (d.life / d.max) * 2.2);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  }
}
