import * as THREE from 'three';
import { knitCanvas, fabricMaterial } from './textures.js';

/* ------------------------------------------------------------------
   Every knitted friend shares one rig (a bob, a head, two arms, two
   legs) so the same walk/jump/idle animation works for all of them,
   but each species gets its own proportions, ears, muzzle and
   accessories — a bear, a bunny in a dress, a fox with a tail, and
   a flippered seal, not four recolours of the same toy.
------------------------------------------------------------------ */

// push vertices in and out along their normals so the surface reads as
// fat chenille loops rather than smooth plastic
function lumpify(geo, amount = 0.045, freq = 9) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    const bump =
      Math.sin(v.x * freq) * Math.cos(v.y * freq * 0.85) +
      Math.sin(v.y * freq * 1.15 + 1.7) * Math.cos(v.z * freq) +
      Math.sin(v.z * freq * 0.9 + 3.1) * Math.cos(v.x * freq * 1.1);
    v.addScaledVector(n, bump * amount * 0.34);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function knitMat(opts) {
  return fabricMaterial(knitCanvas(opts), { repeat: opts.repeat || 1, bump: 0.5, roughness: 1 });
}

const DEFAULT_SKIN = {
  species: 'bear',
  headHex: '#ffffff', headAccent: '#e8f1f7',
  bodyHex: '#4faee6', bodyAccent: '#46a5df', limbHex: '#4aa9e2',
  collarHex: '#f7a9bd',
};

// body proportions and features per species — the skeleton's
// attachment points (head/torso/limb positions) stay fixed so nothing
// clips, only shapes, sizes and accessories change
const SPECIES = {
  bear: {
    torso: [1.0, 1.1, 0.78], torsoR: 0.36,
    head: [1.25, 0.92, 0.78], headR: 0.35,
    muzzle: [1.15, 0.78, 0.6], muzzleR: 0.145, muzzleZ: 0.2,
    arm: [1, 2.3, 0.95], armR: 0.135,
    leg: [1, 2.6, 0.98], legR: 0.115,
    ear: 'round',
  },
  bunny: {
    torso: [0.92, 1.0, 0.76], torsoR: 0.34,
    head: [1.02, 1.0, 0.84], headR: 0.33,
    muzzle: [1.0, 0.72, 0.6], muzzleR: 0.125, muzzleZ: 0.185,
    arm: [1, 2.1, 0.95], armR: 0.115,
    leg: [1, 2.45, 0.98], legR: 0.105,
    ear: 'long', dress: true, bow: true,
  },
  fox: {
    torso: [1.0, 1.05, 0.8], torsoR: 0.35,
    head: [1.1, 0.85, 0.7], headR: 0.32,
    muzzle: [1.7, 0.6, 0.52], muzzleR: 0.13, muzzleZ: 0.3,
    arm: [1, 2.15, 0.95], armR: 0.12,
    leg: [1, 2.45, 0.98], legR: 0.105,
    ear: 'pointed', tail: true, belly: true,
  },
  seal: {
    torso: [1.2, 1.35, 1.0], torsoR: 0.4,
    head: [1.05, 0.85, 0.88], headR: 0.29,
    muzzle: [1.0, 0.68, 0.68], muzzleR: 0.105, muzzleZ: 0.15,
    arm: [2.4, 1.0, 0.7], armR: 0.13,
    leg: [2.5, 0.95, 0.68], legR: 0.135,
    ear: 'tiny',
  },
};

// ears are the single biggest silhouette difference between species
function buildEars(head, earShape, skin, marledYarn2, seedOffset) {
  const ears = [];
  const stitchMat = new THREE.MeshStandardMaterial({ color: skin.collarHex, roughness: 0.95 });

  if (earShape === 'long') {
    // tall floppy bunny ears, upright with a gentle forward droop
    const earGeo = lumpify(new THREE.SphereGeometry(0.1, 16, 14), 0.035, 16 + seedOffset);
    earGeo.scale(1, 3.1, 0.55);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, marledYarn2);
      ear.position.set(0.16 * side, 0.52, 0.02);
      ear.rotation.z = 0.1 * side;
      ear.rotation.x = 0.22;
      ear.userData.baseZ = 0.1 * side;
      ear.castShadow = true;
      head.add(ear);
      ears.push(ear);

      const stitch = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 14), stitchMat);
      stitch.position.set(0.16 * side, 0.24, 0.06);
      stitch.rotation.x = 1.2;
      head.add(stitch);
    }
  } else if (earShape === 'pointed') {
    // pert little fox points, high on the corners
    const earGeo = lumpify(new THREE.ConeGeometry(0.16, 0.26, 14), 0.03, 16 + seedOffset);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, marledYarn2);
      ear.position.set(0.29 * side, 0.32, -0.01);
      ear.rotation.z = -0.12 * side;
      ear.userData.baseZ = -0.12 * side;
      ear.castShadow = true;
      head.add(ear);
      ears.push(ear);

      const stitch = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 14), stitchMat);
      stitch.position.set(0.29 * side, 0.18, 0.05);
      stitch.rotation.x = 1.2;
      head.add(stitch);
    }
  } else if (earShape === 'tiny') {
    // barely-there seal ears, small round nubs close to the head
    const earGeo = lumpify(new THREE.SphereGeometry(0.06, 12, 10), 0.02, 14 + seedOffset);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, marledYarn2);
      ear.position.set(0.24 * side, 0.2, -0.08);
      ear.castShadow = true;
      head.add(ear);
      ears.push(ear);

      const stitch = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 12), stitchMat);
      stitch.position.set(0.24 * side, 0.13, -0.02);
      stitch.rotation.x = 1.2;
      head.add(stitch);
    }
  } else {
    // round bear ears, high on the corners of the head
    const earGeo = lumpify(new THREE.SphereGeometry(0.145, 18, 14), 0.055, 15 + seedOffset);
    earGeo.scale(1, 1, 0.6);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, marledYarn2);
      ear.position.set(0.3 * side, 0.27, -0.01);
      ear.castShadow = true;
      head.add(ear);
      ears.push(ear);

      const stitch = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 6, 14), stitchMat);
      stitch.position.set(0.3 * side, 0.15, 0.06);
      stitch.rotation.x = 1.2;
      head.add(stitch);
    }
  }
  return ears;
}

// a fluffy fox tail, stacked lumps tapering to a cream tip
function buildTail(bob, marledYarn2, whiteYarn) {
  const tailGroup = new THREE.Group();
  const segs = [
    { r: 0.155, y: 0, z: 0, mat: marledYarn2 },
    { r: 0.135, y: 0.12, z: -0.13, mat: marledYarn2 },
    { r: 0.1, y: 0.25, z: -0.24, mat: whiteYarn },
  ];
  segs.forEach((seg) => {
    const m = new THREE.Mesh(lumpify(new THREE.SphereGeometry(seg.r, 14, 12), 0.03, 14), seg.mat);
    m.position.set(0, seg.y, seg.z);
    m.castShadow = true;
    tailGroup.add(m);
  });
  tailGroup.position.set(0, 0.78, -0.3);
  tailGroup.rotation.x = -0.35;
  bob.add(tailGroup);
}

// a pale belly patch on the front of the torso
function buildBellyPatch(bob, whiteYarn) {
  const belly = new THREE.Mesh(lumpify(new THREE.SphereGeometry(0.22, 16, 12), 0.02, 16), whiteYarn);
  belly.scale.set(0.8, 1.0, 0.45);
  belly.position.set(0, 0.75, 0.26);
  bob.add(belly);
}

// a flared crochet dress with a hem trim, plus a hair bow between the
// ears — the pieces that make a character read as dressed up, not
// just recoloured
function buildDress(bob, skin) {
  const dressMat = new THREE.MeshStandardMaterial({ color: skin.dressHex || skin.collarHex, roughness: 0.85 });
  const trimMat = new THREE.MeshStandardMaterial({ color: skin.collarHex, roughness: 0.9 });
  const dressGeo = lumpify(new THREE.ConeGeometry(0.4, 0.5, 20, 1, true), 0.03, 12);
  const dress = new THREE.Mesh(dressGeo, dressMat);
  dress.position.set(0, 0.6, 0);
  dress.castShadow = true;
  bob.add(dress);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 26), trimMat);
  hem.rotation.x = Math.PI / 2;
  hem.position.set(0, 0.35, 0);
  bob.add(hem);
  const waist = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 22), trimMat);
  waist.rotation.x = Math.PI / 2;
  waist.position.set(0, 0.85, 0);
  bob.add(waist);
}

function buildBow(head, skin) {
  const bowMat = new THREE.MeshStandardMaterial({ color: skin.bowHex || skin.collarHex, roughness: 0.75 });
  const bowGroup = new THREE.Group();
  const loopGeo = lumpify(new THREE.SphereGeometry(0.09, 14, 10), 0.02, 14);
  for (const side of [-1, 1]) {
    const loop = new THREE.Mesh(loopGeo, bowMat);
    loop.position.set(0.085 * side, 0, 0);
    loop.scale.set(1.3, 0.8, 0.5);
    loop.rotation.z = 0.55 * side;
    loop.castShadow = true;
    bowGroup.add(loop);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), bowMat);
  bowGroup.add(knot);
  bowGroup.position.set(0.02, 0.4, -0.06);
  bowGroup.rotation.y = 0.3;
  head.add(bowGroup);
}

export function createBear(skin = DEFAULT_SKIN) {
  skin = { ...DEFAULT_SKIN, ...skin };
  const sp = SPECIES[skin.species] || SPECIES.bear;
  const root = new THREE.Group();
  // a little seed variety per character so two skins never look woven identically
  const seedOffset = Math.abs(skin.headHex.charCodeAt(1) || 0) % 20;

  const whiteYarn = knitMat({ yarnA: skin.headHex, yarnB: skin.headAccent, blend: 0.5, cols: 7, rows: 9, seed: 4 + seedOffset, repeat: 2.4 });
  const marledYarn = knitMat({ yarnA: skin.headHex, yarnB: skin.bodyHex, blend: 0.44, cols: 7, rows: 9, seed: 12 + seedOffset, repeat: 2.6 });
  const marledYarn2 = knitMat({ yarnA: skin.headHex, yarnB: skin.bodyAccent, blend: 0.4, cols: 6, rows: 8, seed: 31 + seedOffset, repeat: 2.2 });
  const limbYarn = knitMat({ yarnA: skin.headHex, yarnB: skin.limbHex, blend: 0.44, cols: 8, rows: 10, seed: 47 + seedOffset, repeat: 1.8, marl: 0.05 });

  const bob = new THREE.Group();          // whole-body squash & bounce
  root.add(bob);

  // ---- body: a short, softly rounded torso -------------------------
  const torsoGeo = lumpify(new THREE.SphereGeometry(sp.torsoR, 26, 20), 0.075, 11);
  torsoGeo.scale(...sp.torso);
  const torso = new THREE.Mesh(torsoGeo, marledYarn);
  torso.position.y = 0.85;
  torso.castShadow = true;
  bob.add(torso);

  if (sp.belly) buildBellyPatch(bob, whiteYarn);
  if (sp.tail) buildTail(bob, marledYarn2, whiteYarn);
  if (sp.dress) buildDress(bob, skin);

  // ---- head: wide, flat and white, the way it was knitted ----------
  const head = new THREE.Group();
  head.position.y = 1.42;
  bob.add(head);

  const skullGeo = lumpify(new THREE.SphereGeometry(sp.headR, 30, 22), 0.085, 12);
  skullGeo.scale(...sp.head);
  const skull = new THREE.Mesh(skullGeo, whiteYarn);
  skull.castShadow = true;
  head.add(skull);

  const ears = buildEars(head, sp.ear, skin, marledYarn2, seedOffset);
  if (sp.bow) buildBow(head, skin);

  // ---- face ---------------------------------------------------------
  // No eyes or nose: the toy's face is a plain lump of chenille,
  // and every character keeps that same clean, faceless charm.
  const muzzleGeo = lumpify(new THREE.SphereGeometry(sp.muzzleR, 18, 14), 0.035, 18);
  muzzleGeo.scale(...sp.muzzle);
  const muzzle = new THREE.Mesh(muzzleGeo, whiteYarn);
  muzzle.position.set(0, -0.13, sp.muzzleZ);
  head.add(muzzle);

  // ---- thread tied round the neck ----------------------------------
  const collarThread = new THREE.MeshStandardMaterial({ color: skin.collarHex, roughness: 0.95 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.028, 8, 26), collarThread);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.14;
  collar.scale.set(1, 1, 0.82);
  bob.add(collar);
  for (const side of [-1, 1]) {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.14, 4, 8), collarThread);
    tail.position.set(0.07 * side, 1.07, 0.2);
    tail.rotation.z = 0.55 * side;
    bob.add(tail);
  }

  // ---- limbs: dangly for most, wide flat flippers for the seal -----
  const armGeo = lumpify(new THREE.SphereGeometry(sp.armR, 20, 16), 0.05, 14);
  armGeo.scale(...sp.arm);
  const legGeo = lumpify(new THREE.SphereGeometry(sp.legR, 20, 16), 0.05, 15);
  legGeo.scale(...sp.leg);

  function limb(geo, radius, scaleY, x, y, mat) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = -radius * scaleY;
    mesh.castShadow = true;
    pivot.add(mesh);
    bob.add(pivot);
    return pivot;
  }

  const armL = limb(armGeo, sp.armR, sp.arm[1], -0.3, 1.02, limbYarn);
  const armR = limb(armGeo, sp.armR, sp.arm[1], 0.3, 1.02, limbYarn);
  const legL = limb(legGeo, sp.legR, sp.leg[1], -0.17, 0.6, limbYarn);
  const legR = limb(legGeo, sp.legR, sp.leg[1], 0.17, 0.6, limbYarn);
  // arms held out and down, long enough to swing clear of the body
  armL.rotation.z = -0.85;
  armR.rotation.z = 0.85;

  root.userData = {
    bob, head, ears, torso, armL, armR, legL, legR,
    walkPhase: 0,
  };
  return root;
}

/* ------------------------------------------------------------------
   Animation: swinging limbs on the ground, a starfish shape in the
   air, ears that wobble a beat behind the head.
------------------------------------------------------------------ */
const IDLE_DELAY = 2.0;   // seconds of stillness before a gesture starts
const EMOTE_CYCLE = 3.4;  // seconds per gesture, then on to the next

export function animateBear(bear, dt, state) {
  const d = bear.userData;
  const { speed, grounded, vy, time, hovering } = state;
  const idleTimer = state.idleTimer || 0;

  d.walkPhase += dt * (2.5 + speed * 2.6);
  const swing = Math.sin(d.walkPhase * 2.4) * Math.min(1, speed / 3);
  const idle = Math.sin(time * 1.8) * 0.05;

  if (grounded) {
    d.legL.rotation.x = swing * 0.85;
    d.legR.rotation.x = -swing * 0.85;
    d.armL.rotation.x = -swing * 0.7;
    d.armR.rotation.x = swing * 0.7;
    d.armL.rotation.z = -0.85 - Math.abs(swing) * 0.16;
    d.armR.rotation.z = 0.85 + Math.abs(swing) * 0.16;
    // little bounce with each step, plus a breathing idle
    const bounce = Math.abs(Math.sin(d.walkPhase * 2.4)) * Math.min(1, speed / 3) * 0.06;
    d.bob.position.y = bounce + idle * 0.4;
    d.bob.scale.set(1 + bounce * 0.25, 1 - bounce * 0.3, 1 + bounce * 0.25);
  } else if (hovering) {
    // the flutter hangs in the air: arms spread wide, ears working hard
    d.legL.rotation.x = -0.3;
    d.legR.rotation.x = -0.3;
    d.armL.rotation.x = -0.15;
    d.armR.rotation.x = -0.15;
    d.armL.rotation.z = -1.35 + Math.sin(time * 7) * 0.09;
    d.armR.rotation.z = 1.35 - Math.sin(time * 7) * 0.09;
    d.bob.position.y = Math.sin(time * 9) * 0.025;
    d.bob.scale.set(1, 1, 1);
  } else {
    const rise = THREE.MathUtils.clamp(vy * 0.14, -0.7, 0.7);
    d.legL.rotation.x = -0.5 + rise * 0.5;
    d.legR.rotation.x = -0.5 - rise * 0.4;
    d.armL.rotation.x = -1.1 - rise;
    d.armR.rotation.x = -1.1 - rise;
    d.armL.rotation.z = -1.05;
    d.armR.rotation.z = 1.05;
    d.bob.position.y = 0;
    // stretch going up, squash coming down
    const s = THREE.MathUtils.clamp(vy * 0.035, -0.16, 0.16);
    d.bob.scale.set(1 - s * 0.6, 1 + s, 1 - s * 0.6);
  }

  d.head.rotation.z = Math.sin(time * 1.3) * 0.05 + swing * 0.06;
  d.head.rotation.x = idle * 0.6 - THREE.MathUtils.clamp(vy * 0.02, -0.2, 0.2);
  d.head.rotation.y = 0;
  d.bob.rotation.y = 0;
  d.ears.forEach((ear, i) => {
    const flutterBoost = hovering ? 9 : 5;
    const base = ear.userData.baseZ || 0;
    ear.rotation.z = base + Math.sin(time * flutterBoost + i * 2.1) * (hovering ? 0.22 : 0.12) * (grounded ? 0.4 + speed * 0.1 : 1);
  });

  // idle gestures: only once truly still, pre-empted instantly by any input
  // (game.js zeroes idleTimer the moment the player moves or jumps)
  const idleT = idleTimer - IDLE_DELAY;
  if (grounded && idleT > 0) {
    const local = idleT % EMOTE_CYCLE;
    const emote = Math.floor(idleT / EMOTE_CYCLE) % 3;
    if (emote === 0) {
      // a curious look side to side
      d.head.rotation.y = Math.sin(local * 1.5) * 0.42;
    } else if (emote === 1) {
      // a big stretch, arms up and held
      const lift = Math.min(1, local / 0.5);
      const eased = lift * lift * (3 - 2 * lift);
      d.armL.rotation.x = -0.85 - eased * 1.55;
      d.armR.rotation.x = -0.85 - eased * 1.55;
      d.armL.rotation.z = -0.85 + eased * 0.35;
      d.armR.rotation.z = 0.85 - eased * 0.35;
      d.bob.position.y += eased * 0.06;
    } else {
      // a happy little wiggle
      d.bob.rotation.y = Math.sin(local * 6) * 0.13;
      d.bob.position.y += Math.abs(Math.sin(local * 6)) * 0.045;
    }
  }
}

export function bearLandSquash(bear, force) {
  const d = bear.userData;
  const s = THREE.MathUtils.clamp(force * 0.02, 0.05, 0.3);
  d.bob.scale.set(1 + s, 1 - s, 1 + s);
}
