import * as THREE from 'three';
import { knitCanvas, fabricMaterial } from './textures.js';

/* ------------------------------------------------------------------
   Bramble — a hand-knitted bear, built from lumpy chenille yarn.
   White head, blue-and-white marled body and limbs, pink thread
   tied at the neck. Modelled from the real toy.
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

export function createBear() {
  const root = new THREE.Group();

  // the toy's own yarns: a white head, a blue-and-white marled body
  const whiteYarn = knitMat({ yarnA: '#ffffff', yarnB: '#e8f1f7', blend: 0.5, cols: 7, rows: 9, seed: 4, repeat: 2.4 });
  const marledYarn = knitMat({ yarnA: '#ffffff', yarnB: '#4faee6', blend: 0.44, cols: 7, rows: 9, seed: 12, repeat: 2.6 });
  const marledYarn2 = knitMat({ yarnA: '#ffffff', yarnB: '#46a5df', blend: 0.4, cols: 6, rows: 8, seed: 31, repeat: 2.2 });
  const limbYarn = knitMat({ yarnA: '#ffffff', yarnB: '#4aa9e2', blend: 0.44, cols: 8, rows: 10, seed: 47, repeat: 1.8, marl: 0.05 });

  const bob = new THREE.Group();          // whole-body squash & bounce
  root.add(bob);

  // ---- body: a short, softly rounded torso -------------------------
  const torsoGeo = lumpify(new THREE.SphereGeometry(0.36, 26, 20), 0.075, 11);
  torsoGeo.scale(1.0, 1.1, 0.78);
  const torso = new THREE.Mesh(torsoGeo, marledYarn);
  torso.position.y = 0.85;
  torso.castShadow = true;
  bob.add(torso);

  // ---- head: wide, flat and white, the way it was knitted ----------
  const head = new THREE.Group();
  head.position.y = 1.42;
  bob.add(head);

  const skullGeo = lumpify(new THREE.SphereGeometry(0.35, 30, 22), 0.085, 12);
  skullGeo.scale(1.25, 0.92, 0.78);
  const skull = new THREE.Mesh(skullGeo, whiteYarn);
  skull.castShadow = true;
  head.add(skull);

  // big marled ears, high on the corners of the head
  const earGeo = lumpify(new THREE.SphereGeometry(0.145, 18, 14), 0.055, 15);
  earGeo.scale(1, 1, 0.6);
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, marledYarn2);
    ear.position.set(0.3 * side, 0.27, -0.01);
    ear.castShadow = true;
    head.add(ear);
    ears.push(ear);

    // the pink thread that tacks each ear on
    const stitch = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 6, 14), new THREE.MeshStandardMaterial({ color: 0xf7a9bd, roughness: 0.95 }));
    stitch.position.set(0.3 * side, 0.15, 0.06);
    stitch.rotation.x = 1.2;
    head.add(stitch);
  }

  // ---- face ---------------------------------------------------------
  // No eyes or nose: the toy's face is a plain lump of white chenille,
  // and Bramble keeps it that way.
  const muzzleGeo = lumpify(new THREE.SphereGeometry(0.145, 18, 14), 0.035, 18);
  muzzleGeo.scale(1.15, 0.78, 0.6);
  const muzzle = new THREE.Mesh(muzzleGeo, whiteYarn);
  muzzle.position.set(0, -0.13, 0.2);
  head.add(muzzle);

  // ---- pink thread tied round the neck ----------------------------
  const pinkThread = new THREE.MeshStandardMaterial({ color: 0xf7a9bd, roughness: 0.95 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.028, 8, 26), pinkThread);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.14;
  collar.scale.set(1, 1, 0.82);
  bob.add(collar);
  for (const side of [-1, 1]) {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.14, 4, 8), pinkThread);
    tail.position.set(0.07 * side, 1.07, 0.2);
    tail.rotation.z = 0.55 * side;
    bob.add(tail);
  }

  // ---- long dangly limbs ------------------------------------------
  const armGeo = lumpify(new THREE.SphereGeometry(0.135, 20, 16), 0.05, 14);
  armGeo.scale(1, 2.3, 0.95);
  const legGeo = lumpify(new THREE.SphereGeometry(0.115, 20, 16), 0.05, 15);
  legGeo.scale(1, 2.6, 0.98);

  function limb(geo, x, y, drop, mat) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = drop;
    mesh.castShadow = true;
    pivot.add(mesh);
    bob.add(pivot);
    return pivot;
  }

  const armL = limb(armGeo, -0.3, 1.02, -0.31, limbYarn);
  const armR = limb(armGeo, 0.3, 1.02, -0.31, limbYarn);
  const legL = limb(legGeo, -0.17, 0.6, -0.3, limbYarn);
  const legR = limb(legGeo, 0.17, 0.6, -0.3, limbYarn);
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
export function animateBear(bear, dt, state) {
  const d = bear.userData;
  const { speed, grounded, vy, time } = state;

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
  d.ears.forEach((ear, i) => {
    ear.rotation.z = Math.sin(time * 5 + i * 2.1) * 0.12 * (grounded ? 0.4 + speed * 0.1 : 1);
  });
}

export function bearLandSquash(bear, force) {
  const d = bear.userData;
  const s = THREE.MathUtils.clamp(force * 0.02, 0.05, 0.3);
  d.bob.scale.set(1 + s, 1 - s, 1 + s);
}
