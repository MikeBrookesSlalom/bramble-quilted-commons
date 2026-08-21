import * as THREE from 'three';
import {
  knitCanvas, feltCanvas, weaveCanvas, quiltCanvas, threadCanvas,
  fabricMaterial, makeTexture,
} from './textures.js';

/* ------------------------------------------------------------------
   The Quilted Commons — one level, stitched together out of a
   patchwork meadow, a pond of felt, a pincushion, a tower of thread
   spools and a summit flower. Nothing here wants to hurt you.
------------------------------------------------------------------ */

export class World {
  constructor(scene, levelNumber = 1) {
    this.scene = scene;
    this.levelNumber = levelNumber;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.colliders = [];
    this.movers = [];
    this.buttons = [];
    this.checkpoints = [];
    this.spinners = [];
    this.goal = null;

    this.geo = {};
    if (levelNumber === 2) {
      this.mat = this.buildMaterialsLevel2();
      this.buildLevel2();
    } else {
      this.mat = this.buildMaterials();
      this.build();
    }
  }

  buildMaterialsLevel2() {
    return {
      quilt: fabricMaterial(quiltCanvas({ seed: 91, palette: ['#2c3568', '#3a3f7a', '#4a4a8c', '#28345e', '#39406e', '#242c52', '#4f4a80', '#333a6a'] }), { repeat: 1, bump: 0.25 }),
      quiltSide: fabricMaterial(weaveCanvas({ color: '#20264a', seed: 88 }), { repeat: 3, bump: 0.3 }),
      grass: fabricMaterial(feltCanvas({ color: '#3b4a78', seed: 95 }), { repeat: 4, bump: 0.3 }),
      feltPink: fabricMaterial(feltCanvas({ color: '#c9a8e0', seed: 101 }), { repeat: 2 }),
      feltMint: fabricMaterial(feltCanvas({ color: '#8fd0c9', seed: 102 }), { repeat: 2 }),
      feltButter: fabricMaterial(feltCanvas({ color: '#f0cf7a', seed: 103 }), { repeat: 2 }),
      feltLilac: fabricMaterial(feltCanvas({ color: '#a599e0', seed: 104 }), { repeat: 2 }),
      feltSky: fabricMaterial(feltCanvas({ color: '#4a5a9e', seed: 105 }), { repeat: 2 }),
      feltCoral: fabricMaterial(feltCanvas({ color: '#e08fa0', seed: 106 }), { repeat: 2 }),
      feltCream: fabricMaterial(feltCanvas({ color: '#e8e4f5', seed: 107 }), { repeat: 2 }),
      feltMoss: fabricMaterial(feltCanvas({ color: '#48563c', seed: 108 }), { repeat: 2 }),
      linen: fabricMaterial(weaveCanvas({ color: '#3a3f6e', seed: 109 }), { repeat: 2, bump: 0.35 }),
      denim: fabricMaterial(weaveCanvas({ color: '#324070', seed: 110 }), { repeat: 2, bump: 0.35 }),
      knitMint: fabricMaterial(knitCanvas({ yarnA: '#e8e4f5', yarnB: '#7fc9c0', blend: 0.5, seed: 111 }), { repeat: 2, bump: 0.5 }),
      knitPeach: fabricMaterial(knitCanvas({ yarnA: '#f0e6d8', yarnB: '#e0a86a', blend: 0.5, seed: 112 }), { repeat: 2, bump: 0.5 }),
      knitBlue: fabricMaterial(knitCanvas({ yarnA: '#e8e4f5', yarnB: '#7a8fd8', blend: 0.45, seed: 113 }), { repeat: 2, bump: 0.5 }),
      threadPink: fabricMaterial(threadCanvas({ color: '#c9a8e0', seed: 114 }), { repeat: 2, bump: 0.4 }),
      threadMint: fabricMaterial(threadCanvas({ color: '#7fc9c0', seed: 115 }), { repeat: 2, bump: 0.4 }),
      threadButter: fabricMaterial(threadCanvas({ color: '#e0c070', seed: 116 }), { repeat: 2, bump: 0.4 }),
      threadLilac: fabricMaterial(threadCanvas({ color: '#8f7fd0', seed: 117 }), { repeat: 2, bump: 0.4 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.85 }),
      metal: new THREE.MeshStandardMaterial({ color: 0xd8dde8, roughness: 0.25, metalness: 0.5 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xf0d078, roughness: 0.3, metalness: 0.4, emissive: 0x8a6a1a, emissiveIntensity: 0.5 }),
      moonMetal: new THREE.MeshStandardMaterial({ color: 0xdfe6f5, roughness: 0.22, metalness: 0.35, emissive: 0x8fa8e0, emissiveIntensity: 0.4 }),
      stuffing: new THREE.MeshStandardMaterial({ color: 0xe8e4f0, roughness: 1 }),
      pinkYarn: new THREE.MeshStandardMaterial({ color: 0xc9a8e0, roughness: 0.95 }),
    };
  }

  buildMaterials() {
    return {
      quilt: fabricMaterial(quiltCanvas({ seed: 3 }), { repeat: 1, bump: 0.25 }),
      quiltSide: fabricMaterial(weaveCanvas({ color: '#c9b48f', seed: 8 }), { repeat: 3, bump: 0.3 }),
      grass: fabricMaterial(feltCanvas({ color: '#9ecf9a', seed: 15 }), { repeat: 4, bump: 0.3 }),
      feltPink: fabricMaterial(feltCanvas({ color: '#f2b6c8', seed: 21 }), { repeat: 2 }),
      feltMint: fabricMaterial(feltCanvas({ color: '#a9dcc9', seed: 22 }), { repeat: 2 }),
      feltButter: fabricMaterial(feltCanvas({ color: '#f7dfa5', seed: 23 }), { repeat: 2 }),
      feltLilac: fabricMaterial(feltCanvas({ color: '#cbbde8', seed: 24 }), { repeat: 2 }),
      feltSky: fabricMaterial(feltCanvas({ color: '#a8cfe8', seed: 25 }), { repeat: 2 }),
      feltCoral: fabricMaterial(feltCanvas({ color: '#f4a48c', seed: 26 }), { repeat: 2 }),
      feltCream: fabricMaterial(feltCanvas({ color: '#f6ecd8', seed: 27 }), { repeat: 2 }),
      feltMoss: fabricMaterial(feltCanvas({ color: '#8fc79c', seed: 28 }), { repeat: 2 }),
      linen: fabricMaterial(weaveCanvas({ color: '#e6d7ba', seed: 33 }), { repeat: 2, bump: 0.35 }),
      denim: fabricMaterial(weaveCanvas({ color: '#8fb6d6', seed: 34 }), { repeat: 2, bump: 0.35 }),
      knitMint: fabricMaterial(knitCanvas({ yarnA: '#dff3e6', yarnB: '#8ed4b4', blend: 0.5, seed: 41 }), { repeat: 2, bump: 0.5 }),
      knitPeach: fabricMaterial(knitCanvas({ yarnA: '#ffe9d6', yarnB: '#f4b183', blend: 0.5, seed: 42 }), { repeat: 2, bump: 0.5 }),
      knitBlue: fabricMaterial(knitCanvas({ yarnA: '#ffffff', yarnB: '#69b9e6', blend: 0.45, seed: 43 }), { repeat: 2, bump: 0.5 }),
      threadPink: fabricMaterial(threadCanvas({ color: '#f2a0b5', seed: 51 }), { repeat: 2, bump: 0.4 }),
      threadMint: fabricMaterial(threadCanvas({ color: '#8fd4c0', seed: 52 }), { repeat: 2, bump: 0.4 }),
      threadButter: fabricMaterial(threadCanvas({ color: '#efd08a', seed: 53 }), { repeat: 2, bump: 0.4 }),
      threadLilac: fabricMaterial(threadCanvas({ color: '#bda9e0', seed: 54 }), { repeat: 2, bump: 0.4 }),
      wood: new THREE.MeshStandardMaterial({ color: 0xd8b98a, roughness: 0.85 }),
      metal: new THREE.MeshStandardMaterial({ color: 0xeef2f5, roughness: 0.28, metalness: 0.45 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xf0c04a, roughness: 0.35, metalness: 0.5, emissive: 0x6b4a05, emissiveIntensity: 0.35 }),
      stuffing: new THREE.MeshStandardMaterial({ color: 0xfffaf3, roughness: 1 }),
      pinkYarn: new THREE.MeshStandardMaterial({ color: 0xf7a9bd, roughness: 0.95 }),
    };
  }

  /* ---------------- collider helpers ---------------- */

  addBox(cx, topY, cz, w, h, d, mat, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(cx, topY - h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    const col = {
      type: 'box', mesh, half: new THREE.Vector3(w / 2, h / 2, d / 2),
      pos: mesh.position.clone(), bounce: opts.bounce || 0, tag: opts.tag,
    };
    this.colliders.push(col);
    if (opts.move) this.addMover(col, opts.move);
    return col;
  }

  addCyl(cx, topY, cz, r, h, mat, opts = {}) {
    const seg = opts.seg || 26;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, opts.rBottom ?? r, h, seg), mat);
    mesh.position.set(cx, topY - h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    const col = {
      type: 'cyl', mesh, radius: r, height: h,
      pos: mesh.position.clone(), bounce: opts.bounce || 0, tag: opts.tag,
    };
    this.colliders.push(col);
    if (opts.move) this.addMover(col, opts.move);
    return col;
  }

  // movers slide along one axis; anything standing on them is carried
  addMover(col, move) {
    const base = col.pos.clone();
    const m = {
      col, base, axis: move.axis || 'y', amp: move.amp ?? 2,
      speed: move.speed ?? 0.6, phase: move.phase ?? 0,
      delta: new THREE.Vector3(), extra: move.extra || null,
    };
    col.mover = m;
    this.movers.push(m);
    return m;
  }

  updateMovers(t) {
    for (const m of this.movers) {
      const prev = m.col.pos.clone();
      const off = Math.sin(t * m.speed + m.phase) * m.amp;
      m.col.pos.copy(m.base);
      m.col.pos[m.axis] += off;
      if (m.extra) m.extra(m, t);
      m.col.mesh.position.copy(m.col.pos);
      if (m.col.visual) m.col.visual.position.copy(m.col.pos);
      m.delta.subVectors(m.col.pos, prev);
    }
    for (const s of this.spinners) s.rotation.y += s.userData.spin;
  }

  /* ---------------- decorative props ---------------- */

  feltFlower(x, y, z, scale = 1, petalMat = this.mat.feltPink) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.1, 8), this.mat.feltMoss);
    stem.position.y = 0.55;
    g.add(stem);
    const petalGeo = new THREE.SphereGeometry(0.22, 12, 10);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = new THREE.Mesh(petalGeo, petalMat);
      p.position.set(Math.cos(a) * 0.26, 1.12, Math.sin(a) * 0.26);
      p.scale.set(1, 0.45, 1);
      g.add(p);
    }
    const centre = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), this.mat.feltButter);
    centre.position.y = 1.16;
    centre.scale.y = 0.6;
    g.add(centre);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), this.mat.feltMoss);
    leaf.position.set(0.2, 0.5, 0);
    leaf.scale.set(1.4, 0.25, 0.7);
    g.add(leaf);
    g.position.set(x, y, z);
    g.scale.setScalar(scale);
    g.rotation.y = Math.random() * Math.PI;
    this.group.add(g);
    return g;
  }

  grassTuft(x, y, z, mat = this.mat.grass) {
    const g = new THREE.Group();
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5 + Math.random() * 0.5, 5), mat);
      blade.position.set((Math.random() - 0.5) * 0.35, 0.3, (Math.random() - 0.5) * 0.35);
      blade.rotation.z = (Math.random() - 0.5) * 0.6;
      g.add(blade);
    }
    g.position.set(x, y, z);
    this.group.add(g);
    return g;
  }

  // a wooden spool wound with thread — the workhorse platform of the level
  spool(x, topY, z, r, h, threadMat, opts = {}) {
    const rimH = h * 0.12;
    const col = this.addCyl(x, topY, z, r, h, this.mat.wood, opts);
    col.mesh.visible = false; // replaced by the detailed model below

    const g = new THREE.Group();
    g.position.copy(col.pos);
    const disc = new THREE.CylinderGeometry(r, r, rimH, 30);
    const top = new THREE.Mesh(disc, this.mat.wood);
    top.position.y = h / 2 - rimH / 2;
    const bot = new THREE.Mesh(disc, this.mat.wood);
    bot.position.y = -h / 2 + rimH / 2;
    const wound = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.82, h - rimH * 2, 30), threadMat);
    [top, bot, wound].forEach((m) => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
    // a loose thread trailing off the reel
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(r * 0.8, 0, 0),
      new THREE.Vector3(r * 1.5, -0.4, 0.6),
      new THREE.Vector3(r * 1.7, -1.4, -0.3),
      new THREE.Vector3(r * 1.3, -2.4, 0.4),
    ]);
    const tail = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.045, 6), threadMat);
    g.add(tail);
    this.group.add(g);
    col.visual = g;
    return col;
  }

  giantButton(x, topY, z, r, mat, opts = {}) {
    const h = opts.height ?? 0.55;
    const col = this.addCyl(x, topY, z, r, h, mat, opts);
    col.mesh.castShadow = true;
    // four thread holes with an X of stitching over them
    const holeGeo = new THREE.CylinderGeometry(r * 0.09, r * 0.09, h * 1.3, 10);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x8f7f6a, roughness: 1 });
    const g = new THREE.Group();
    const offs = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const [ox, oz] of offs) {
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(ox * r * 0.2, 0, oz * r * 0.2);
      g.add(hole);
    }
    const threadMat = opts.thread || this.mat.pinkYarn;
    for (const rot of [Math.PI / 4, -Math.PI / 4]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.045, r * 0.045, r * 0.62, 6), threadMat);
      t.rotation.set(Math.PI / 2, 0, rot);
      t.position.y = h / 2;
      g.add(t);
    }
    // dished rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.86, r * 0.07, 8, 30), mat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = h / 2;
    g.add(rim);
    g.position.copy(col.pos);
    this.group.add(g);
    col.visual = g;
    if (col.mover) col.mover.col.visual = g;
    return col;
  }

  cloud(x, y, z, scale = 1) {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random() * 0.7, 14, 12), this.mat.stuffing);
      puff.position.set((Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 2.4);
      g.add(puff);
    }
    g.position.set(x, y, z);
    g.scale.setScalar(scale);
    this.group.add(g);
    return g;
  }

  bunting(from, to, sag = 2.2, mats) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -sag, 0));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.035, 5), this.mat.pinkYarn);
    this.group.add(line);
    const flags = mats || [this.mat.feltPink, this.mat.feltMint, this.mat.feltButter, this.mat.feltLilac, this.mat.feltSky];
    const n = 9;
    for (let i = 1; i < n; i++) {
      const p = curve.getPoint(i / n);
      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 3), flags[i % flags.length]);
      flag.position.copy(p).add(new THREE.Vector3(0, -0.36, 0));
      flag.rotation.x = Math.PI;
      flag.rotation.y = Math.PI / 4;
      this.group.add(flag);
    }
  }

  embroideryHoop(x, y, z, r, rot = 0) {
    const g = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.055, 10, 44), this.mat.wood);
    g.add(outer);
    const cloth = new THREE.Mesh(
      new THREE.CircleGeometry(r * 0.97, 40),
      new THREE.MeshStandardMaterial({
        map: makeTexture(weaveCanvas({ color: '#f3e6cd', seed: 61 }), 3),
        roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.92,
      })
    );
    g.add(cloth);
    // a stitched flower on the cloth
    const petalMat = this.mat.feltPink;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = new THREE.Mesh(new THREE.SphereGeometry(r * 0.09, 10, 8), petalMat);
      p.position.set(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28, 0.04);
      p.scale.z = 0.4;
      g.add(p);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.1, 10, 8), this.mat.feltButter);
    c.position.z = 0.05;
    c.scale.z = 0.4;
    g.add(c);
    g.position.set(x, y, z);
    g.rotation.y = rot;
    this.group.add(g);
    return g;
  }

  /* ---------------- pickups ---------------- */

  addCollectible(x, y, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 20), this.mat.gold);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.045, 8, 20), this.mat.gold);
    g.add(rim);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x9a7413, roughness: 0.8 });
    for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 8), holeMat);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(ox * 0.1, oy * 0.1, 0);
      g.add(hole);
    }
    g.position.set(x, y, z);
    this.group.add(g);
    const item = { group: g, home: new THREE.Vector3(x, y, z), taken: false };
    this.buttons.push(item);
    return item;
  }

  addCheckpoint(x, y, z, label) {
    const g = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.9, 20, 1, true), this.mat.metal);
    cup.position.y = 0.45;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.metal);
    dome.position.y = 0.9;
    [cup, dome].forEach((m) => { m.material = this.mat.metal; g.add(m); });
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.06, 8, 22), this.mat.pinkYarn);
    ribbon.rotation.x = Math.PI / 2;
    ribbon.position.y = 0.3;
    g.add(ribbon);
    g.position.set(x, y, z);
    this.group.add(g);
    const cp = { group: g, pos: new THREE.Vector3(x, y, z), active: false, label, ribbon };
    this.checkpoints.push(cp);
    return cp;
  }

  /* ================= the level itself ================= */

  build() {
    const M = this.mat;

    /* --- 1. the patchwork meadow you wake up on --- */
    const island = this.addCyl(0, 0, 4, 10, 3, M.quilt, { seg: 40 });
    island.mesh.material = [M.quiltSide, M.quilt, M.quiltSide];
    island.mesh.geometry = new THREE.CylinderGeometry(10, 9.4, 3, 40);
    // a felt skirt of grass around the rim
    const skirt = new THREE.Mesh(new THREE.TorusGeometry(9.9, 0.55, 10, 44), M.grass);
    skirt.rotation.x = Math.PI / 2;
    skirt.position.set(0, -0.2, 4);
    this.group.add(skirt);

    const flowerMats = [M.feltPink, M.feltButter, M.feltLilac, M.feltCoral, M.feltSky];
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 6.2;
      this.feltFlower(Math.cos(a) * r, 0, 4 + Math.sin(a) * r, 0.6 + Math.random() * 0.6,
        flowerMats[Math.floor(Math.random() * flowerMats.length)]);
    }
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 7.5;
      this.grassTuft(Math.cos(a) * r, 0, 4 + Math.sin(a) * r);
    }

    // welcome hoop: a landmark off to the side, not a gate across the
    // path — spawn looks straight down -z at the first jump, so nothing
    // stands on that sightline
    this.embroideryHoop(-7.2, 5.5, 1.5, 4.0, Math.PI * 0.32);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 5, 10), M.wood);
      post.position.set(-7.2 + Math.cos(Math.PI * 0.32) * side * 3.75, 2.5, 1.5 + Math.sin(Math.PI * 0.32) * side * 3.75);
      this.group.add(post);
    }

    // a sleeping ball of yarn to sit beside the start
    const yarnBall = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 18), M.knitPeach);
    yarnBall.position.set(-6, 1.4, 7);
    yarnBall.castShadow = true;
    this.group.add(yarnBall);
    this.addCyl(-6, 2.6, 7, 1.15, 3, M.knitPeach, { seg: 18 }).mesh.visible = false;

    this.addCheckpoint(2.8, 0, 3.2, 'The Meadow').active = true;

    /* --- 2. stepping buttons over the felt pond --- */
    const pond = new THREE.Mesh(new THREE.CircleGeometry(13, 44), M.feltSky);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(0, -3.4, -17);
    this.group.add(pond);
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3 + i * 2, 0.16, 8, 50), M.feltMint);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, -3.3, -17);
      this.group.add(ring);
    }
    // lily pads of felt drifting on it
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 8;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.9 + Math.random() * 0.7, 18, 0, Math.PI * 1.82), M.feltMoss);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = Math.random() * Math.PI * 2;
      pad.position.set(Math.cos(a) * r, -3.28, -17 + Math.sin(a) * r);
      this.group.add(pad);
    }

    const btnMats = [M.feltPink, M.feltButter, M.feltMint, M.feltLilac];
    const stepDefs = [
      [1.2, 0.4, -0.3, 1.9, 5.0],
      [-1.0, 0.8, -4.7, 1.9, 5.8],
      [0, 1.2, -9.0, 1.9, 0.0],
      [2.4, 2.3, -13.2, 1.8, 1.0],
      [-0.6, 3.4, -17.0, 1.8, 2.0],
      [2.2, 4.5, -20.8, 1.8, 3.0],
      [-0.2, 5.5, -24.4, 1.8, 4.0],
    ];
    stepDefs.forEach(([x, y, z, r, ph], i) => {
      this.giantButton(x, y, z, r, btnMats[i % btnMats.length], {
        move: { axis: 'y', amp: 0.32, speed: 0.9, phase: ph },
        thread: [M.pinkYarn, M.pinkYarn, M.pinkYarn][0],
      });
    });
    this.addCollectible(-1.0, 1.6, -4.7);
    this.addCollectible(2.4, 3.9, -13.2);
    this.addCollectible(-0.6, 5.0, -17.0);
    this.addCollectible(-8.5, 1.6, 4);

    /* --- 3. the felt ledge and its bunting --- */
    this.addBox(0, 5.8, -31, 10, 1.5, 9, M.linen, {});
    const ledgeTrim = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.3, 9.4), M.feltCoral);
    ledgeTrim.position.set(0, 5.9, -31);
    this.group.add(ledgeTrim);
    this.addCheckpoint(-3, 5.8, -29, 'Linen Ledge');
    this.feltFlower(3.5, 5.8, -29, 0.8, M.feltLilac);
    this.feltFlower(4.2, 5.8, -33, 0.7, M.feltPink);
    this.addCollectible(3.9, 7.1, -34);
    this.bunting([-5, 8.4, -31], [5, 8.4, -31], 1.4);
    for (const side of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3, 8), M.wood);
      pole.position.set(side * 5, 7.3, -31);
      this.group.add(pole);
    }

    /* --- 4. ribbon sliders --- */
    const ribbonDefs = [
      [6.4, -34.25, 3.6, 4.2, M.threadPink],
      [7.0, -37.5, 3.6, 0.0, M.threadPink],
      [8.3, -42.3, 3.6, 0.8, M.threadMint],
      [8.95, -44.6, 3.0, 1.2, M.threadLilac],
      [9.6, -46.9, 3.2, 1.6, M.threadButter],
      [10.9, -51.6, 2.8, 2.4, M.threadLilac],
    ];
    ribbonDefs.forEach(([y, z, amp, ph, mat]) => {
      const col = this.addBox(0, y, z, 3.6, 0.5, 3.6, mat, {
        move: { axis: 'x', amp, speed: 0.5, phase: ph },
      });
      // a stitched cream border round the ribbon, leaving the weave on show
      for (const [ex, ez, ew, ed] of [[0, 1.85, 3.9, 0.2], [0, -1.85, 3.9, 0.2], [1.85, 0, 0.2, 3.9], [-1.85, 0, 0.2, 3.9]]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(ew, 0.18, ed), M.feltCream);
        bar.position.set(ex, 0.2, ez);
        col.mesh.add(bar);
      }
    });
    this.addCollectible(0, 8.4, -34.25);
    this.addCollectible(0, 9.0, -42.3);
    this.addCollectible(0, 10.35, -44.6);
    // long ribbons streaming through the gap, just for the look of it
    for (let i = 0; i < 5; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-13 + i * 6, 14 + Math.random() * 4, -34 - i * 4),
        new THREE.Vector3(-9 + i * 6, 10, -40 - i * 3),
        new THREE.Vector3(-14 + i * 7, 5, -46 - i * 3),
        new THREE.Vector3(-10 + i * 6, -2, -50 - i * 2),
      ]);
      const ribbon = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 40, 0.22, 4),
        [M.threadPink, M.threadMint, M.threadLilac, M.threadButter, M.threadPink][i]
      );
      this.group.add(ribbon);
    }

    /* --- 5. the pincushion trampoline --- */
    // squat plush dome: flat enough on top to stand on, round at the shoulder
    const cushion = this.addCyl(0, 11.6, -57, 3.3, 5.4, M.feltCoral, { seg: 34 });
    cushion.mesh.visible = false;
    const cushionProfile = [
      [0, 2.7], [2.0, 2.65], [3.1, 2.35], [3.9, 1.6],
      [4.35, 0.4], [4.2, -1.2], [3.4, -2.4], [0, -2.7],
    ].reverse().map(([r, y]) => new THREE.Vector2(r, y)); // bottom-up, so the normals face out
    const cushionMesh = new THREE.Mesh(new THREE.LatheGeometry(cushionProfile, 34), M.feltCoral);
    cushionMesh.position.copy(cushion.pos);
    cushionMesh.castShadow = true;
    cushionMesh.receiveShadow = true;
    this.group.add(cushionMesh);
    // the seam that divides a tomato pincushion into segments
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pts = cushionProfile
        .filter((v) => v.x > 0.05)
        .map((v) => new THREE.Vector3(Math.cos(a) * v.x * 1.01, v.y * 1.01, Math.sin(a) * v.x * 1.01));
      pts.push(new THREE.Vector3(0, cushionProfile[cushionProfile.length - 1].y * 1.01, 0)); // meet at the top
      const seam = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.05, 5), M.pinkYarn
      );
      seam.position.copy(cushion.pos);
      this.group.add(seam);
    }
    // pins stuck in at jaunty angles (decoration only — nothing sharp underfoot)
    const pinHeadMats = [M.feltPink, M.feltMint, M.feltButter, M.feltLilac, M.feltSky];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const r = 3.3;
      const pin = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), M.metal);
      shaft.position.y = 1.2;
      pin.add(shaft);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), pinHeadMats[i % 5]);
      head.position.y = 2.5;
      pin.add(head);
      pin.position.set(Math.cos(a) * r, 10.2, -57 + Math.sin(a) * r);
      pin.rotation.z = -Math.cos(a) * 0.75;
      pin.rotation.x = Math.sin(a) * 0.75;
      this.group.add(pin);
    }
    this.addCheckpoint(0, 11.6, -54.6, 'Pincushion');
    this.addCollectible(0, 13.2, -57);

    // three springy thimble-tops that fling you skyward
    const padPositions = [[-2.0, -58.4], [2.0, -58.4], [0, -54.9]];
    padPositions.forEach(([px, pz], i) => {
      const pad = this.addCyl(px, 11.9, pz, 1.05, 0.9, M.knitMint, { bounce: 25, seg: 20 });
      const coil = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.11, 8, 26), M.pinkYarn);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(px, 11.9, pz);
      this.group.add(coil);
      pad.padCoil = coil;
    });

    /* --- 6. the spool tower --- */
    this.spool(0, 20.2, -63.5, 3.6, 3.2, M.threadLilac);
    this.spool(5.6, 21.8, -68, 2.4, 2.6, M.threadPink);
    this.spool(9.2, 23.4, -72.5, 2.2, 2.6, M.threadMint);
    this.spool(5.6, 25.0, -77, 2.2, 2.6, M.threadButter);
    this.addCheckpoint(5.6, 25.0, -77, 'Spool Top');
    this.addCollectible(9.2, 25.2, -72.5);
    this.addCollectible(0, 22.0, -63.5);
    this.bunting([0, 23.5, -63.5], [9.2, 26, -72.5], 1.6);

    // giant scissors resting against the tower, purely scenic
    const scissors = new THREE.Group();
    for (const side of [-1, 1]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.5, 0.12), M.metal);
      blade.position.set(side * 0.28, 3.3, 0);
      blade.rotation.z = side * 0.06;
      scissors.add(blade);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.2, 8, 22), M.feltCoral);
      ring.position.set(side * 1.15, -0.9, 0);
      scissors.add(ring);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 8), M.feltCoral);
      handle.position.set(side * 0.7, 0, 0);
      handle.rotation.z = side * 0.6;
      scissors.add(handle);
    }
    scissors.position.set(-8.5, 15.5, -66);
    scissors.rotation.z = 0.45;
    scissors.rotation.y = 0.5;
    this.group.add(scissors);

    /* --- 7. the thread-reel lift --- */
    // dips to the height of the last spool, so there is always a moment to step on
    const lift = this.addCyl(1.0, 26.6, -82, 2.4, 1.2, M.threadMint, {
      move: { axis: 'y', amp: 2.4, speed: 0.5, phase: 0 }, seg: 26,
    });
    const liftRim = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.16, 8, 30), M.wood);
    liftRim.rotation.x = Math.PI / 2;
    liftRim.position.y = 0.6;
    lift.mesh.add(liftRim);
    // the thread it hangs from, running up out of sight
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 30, 6), M.pinkYarn);
    wire.position.set(1.0, 44, -82);
    this.group.add(wire);

    /* --- 8. bobbing yarn balls --- */
    const ballDefs = [
      [-3.0, 30.2, -85.0, 1.9, M.knitPeach, 0.0],
      [1.0, 31.5, -87.5, 1.9, M.knitMint, 1.5],
      [-1.6, 32.8, -90.2, 1.9, M.knitBlue, 3.0],
      [-0.8, 33.6, -93.1, 1.9, M.knitPeach, 4.4],
    ];
    ballDefs.forEach(([x, y, z, r, mat, ph]) => {
      const col = this.addCyl(x, y, z, r * 0.8, 2.2, mat, {
        move: { axis: 'y', amp: 0.45, speed: 1.1, phase: ph }, seg: 20,
      });
      col.mesh.visible = false;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 20), mat);
      ball.position.copy(col.pos).add(new THREE.Vector3(0, -r + 1.1, 0));
      ball.castShadow = true;
      const holder = new THREE.Group();
      holder.add(ball);
      holder.position.copy(col.pos);
      ball.position.set(0, -r + 1.1, 0);
      this.group.add(holder);
      col.visual = holder;
      holder.userData.spin = 0.004;
      this.spinners.push(holder);
      // strand of yarn trailing off each ball
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -r + 1.1, r * 0.9),
        new THREE.Vector3(0.6, -r - 0.5, r * 1.4),
        new THREE.Vector3(-0.4, -r - 2.0, r * 1.1),
      ]);
      holder.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.06, 5), mat));
    });
    this.addCollectible(1.0, 32.9, -87.5);
    this.addCollectible(-0.8, 35.0, -93.1);

    /* --- 9. the needle bridge --- */
    const needle = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 14, 14), M.metal);
    shaft.rotation.x = Math.PI / 2;
    needle.add(shaft);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.22, 10, 26), M.metal);
    eye.position.z = -6.4;
    eye.rotation.y = Math.PI / 2;
    needle.add(eye);
    needle.position.set(0, 33.6, -99);
    this.group.add(needle);
    // walkable strip laid along the needle's spine
    this.addBox(0, 34.4, -99, 1.6, 0.5, 13.6, M.linen, {});
    // thread running through the needle's eye and away
    const threadCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 33.6, -105.4),
      new THREE.Vector3(3.0, 35.4, -109),
      new THREE.Vector3(-1.5, 37.5, -113),
    ]);
    this.group.add(new THREE.Mesh(new THREE.TubeGeometry(threadCurve, 30, 0.08, 6), M.pinkYarn));

    /* --- 10. the summit flower --- */
    const summitY = 34.4;
    const summit = this.addCyl(0, summitY, -112, 6.2, 2.4, M.feltButter, { seg: 40 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(2.5, 18, 14), M.feltPink);
      petal.position.set(Math.cos(a) * 6.4, summitY - 1.1, -112 + Math.sin(a) * 6.4);
      petal.scale.set(1.25, 0.42, 1.25);
      petal.castShadow = true;
      this.group.add(petal);
    }
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 30, 14), M.feltMoss);
    stalk.position.set(0, summitY - 16, -112);
    this.group.add(stalk);
    this.addCheckpoint(-3.4, summitY, -110, 'Summit');
    this.addCollectible(4.2, summitY + 1.4, -113.5);
    this.addCollectible(0, summitY + 2.0, -117.2);
    this.addCollectible(-4.6, summitY + 1.4, -113.5);
    this.bunting([-6, summitY + 5, -112], [6, summitY + 5, -112], 1.8);

    // the golden thimble at the very top
    const goal = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 1.8, 24, 1, true), M.gold);
    cup.position.y = 0.9;
    goal.add(cup);
    const domeG = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.gold);
    domeG.position.y = 1.8;
    goal.add(domeG);
    for (let ring = 0; ring < 3; ring++) {
      const dimple = new THREE.Mesh(new THREE.TorusGeometry(0.9 - ring * 0.03, 0.05, 6, 24), M.gold);
      dimple.rotation.x = Math.PI / 2;
      dimple.position.y = 0.5 + ring * 0.45;
      goal.add(dimple);
    }
    goal.position.set(0, summitY + 0.4, -112);
    this.group.add(goal);
    this.goal = { group: goal, pos: new THREE.Vector3(0, summitY + 1, -112), reached: false };
    const pedestal = this.addCyl(0, summitY + 0.4, -112, 1.4, 0.8, M.knitBlue, { seg: 20 });
    pedestal.tag = 'pedestal';

    /* --- clouds of stuffing, drifting through the whole climb --- */
    const cloudDefs = [
      [-16, 9, -20, 1.2], [18, 14, -34, 1.5], [-20, 20, -52, 1.3],
      [16, 24, -70, 1.1], [-18, 30, -88, 1.4], [14, 33, -100, 1.2],
      [-14, 38, -112, 1.6], [0, 44, -60, 1.8], [22, 30, -95, 1.0],
    ];
    for (const [x, y, z, s] of cloudDefs) {
      const c = this.cloud(x, y, z, s);
      c.userData.drift = { base: x, amp: 1.6 + Math.random() * 1.8, speed: 0.12 + Math.random() * 0.12, phase: Math.random() * 6 };
      this.movers.push({
        col: { pos: c.position, mesh: c }, base: c.position.clone(), axis: 'x',
        amp: c.userData.drift.amp, speed: c.userData.drift.speed,
        phase: c.userData.drift.phase, delta: new THREE.Vector3(),
      });
    }
  }
  /* ================= level 2: The Midnight Mending Loft ================= */

  buildLevel2() {
    const M = this.mat;

    /* --- 1. moonlit meadow --- */
    const island = this.addCyl(0, 0, 4, 8, 3, M.quilt, { seg: 36 });
    island.mesh.material = [M.quiltSide, M.quilt, M.quiltSide];
    island.mesh.geometry = new THREE.CylinderGeometry(8, 7.5, 3, 36);
    const skirt = new THREE.Mesh(new THREE.TorusGeometry(7.9, 0.5, 10, 40), M.grass);
    skirt.rotation.x = Math.PI / 2;
    skirt.position.set(0, -0.2, 4);
    this.group.add(skirt);

    const flowerMats = [M.feltPink, M.feltLilac, M.feltMint];
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.random() * 4.5;
      this.feltFlower(Math.cos(a) * r, 0, 4 + Math.sin(a) * r, 0.55 + Math.random() * 0.5,
        flowerMats[Math.floor(Math.random() * flowerMats.length)]);
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 6;
      this.grassTuft(Math.cos(a) * r, 0, 4 + Math.sin(a) * r, M.grass);
    }
    this.embroideryHoop(-6.2, 5.0, 1.5, 3.6, Math.PI * 0.3);

    this.addCheckpoint(2.2, 0, 3, 'Moonlit Meadow').active = true;

    /* --- 2. lantern steps --- */
    const lanternDefs = [
      [1.6, 0.95, -0.6, 0.0],
      [-1.7, 1.95, -4.9, 1.0],
      [1.8, 3.0, -9.0, 2.0],
      [-1.2, 4.05, -13.0, 3.0],
    ];
    lanternDefs.forEach(([x, y, z, ph]) => {
      this.giantButton(x, y, z, 1.8, M.feltButter, {
        move: { axis: 'y', amp: 0.3, speed: 0.85, phase: ph },
        thread: M.pinkYarn,
      });
      const glow = new THREE.PointLight(0xffcf7a, 0.5, 6, 2);
      glow.position.set(x, y + 1.3, z);
      this.group.add(glow);
    });
    this.addCollectible(-1.7, 3.6, -4.9);
    this.addCollectible(-1.2, 5.7, -13.0);

    this.addBox(0, 4.5, -18.5, 4.4, 1, 4.4, M.linen, {});
    this.addCheckpoint(-1.6, 4.5, -17.3, 'Lantern Steps');
    this.feltFlower(1.8, 4.5, -20.2, 0.7, M.feltLilac);
    this.bunting([-2.4, 6.6, -18.5], [2.4, 6.6, -18.5], 1.1);

    /* --- 3. frost ribbons --- */
    const ribbonDefs = [
      [0, 5.5, -22.5, 3.2, 0.0, M.threadLilac],
      [0, 6.6, -26.7, 2.9, 1.0, M.threadMint],
      [0, 7.8, -31.0, 2.6, 2.0, M.threadButter],
      [0, 9.0, -35.4, 2.2, 3.0, M.threadPink],
    ];
    ribbonDefs.forEach(([x, y, z, amp, ph, mat]) => {
      const col = this.addBox(x, y, z, 3.4, 0.5, 3.4, mat, {
        move: { axis: 'x', amp, speed: 0.5, phase: ph },
      });
      for (const [ex, ez, ew, ed] of [[0, 1.75, 3.7, 0.2], [0, -1.75, 3.7, 0.2], [1.75, 0, 0.2, 3.7], [-1.75, 0, 0.2, 3.7]]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(ew, 0.18, ed), M.feltCream);
        bar.position.set(ex, 0.2, ez);
        col.mesh.add(bar);
      }
    });
    this.addCollectible(0, 8.1, -31.0);

    /* --- 4. moon cushion, and the springs that launch you skyward --- */
    const cushionCol = this.addCyl(0, 9.9, -40.5, 2.6, 4.2, M.feltCoral, { seg: 30 });
    cushionCol.mesh.visible = false;
    const cushionProfile = [
      [0, 2.1], [1.4, 2.05], [2.1, 1.8], [2.55, 1.2],
      [2.75, 0.25], [2.6, -0.9], [2.05, -1.8], [0, -2.1],
    ].reverse().map(([r, y]) => new THREE.Vector2(r, y));
    const cushionMesh = new THREE.Mesh(new THREE.LatheGeometry(cushionProfile, 30), M.feltCoral);
    cushionMesh.position.copy(cushionCol.pos);
    cushionMesh.castShadow = true;
    cushionMesh.receiveShadow = true;
    this.group.add(cushionMesh);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pts = cushionProfile
        .filter((v) => v.x > 0.05)
        .map((v) => new THREE.Vector3(Math.cos(a) * v.x * 1.01, v.y * 1.01, Math.sin(a) * v.x * 1.01));
      pts.push(new THREE.Vector3(0, cushionProfile[cushionProfile.length - 1].y * 1.01, 0));
      const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.04, 5), M.pinkYarn);
      seam.position.copy(cushionCol.pos);
      this.group.add(seam);
    }
    this.addCheckpoint(0, 9.9, -38.3, 'Moon Cushion');

    const padPositions = [[-1.2, -39.3], [1.2, -39.3], [0, -42.5]];
    padPositions.forEach(([px, pz]) => {
      const pad = this.addCyl(px, 10.2, pz, 0.95, 0.9, M.knitMint, { bounce: 25, seg: 20 });
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.1, 8, 26), M.pinkYarn);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(px, 10.2, pz);
      this.group.add(coil);
      pad.padCoil = coil;
    });

    /* --- 5. silver spool climb --- */
    this.spool(0, 20.0, -46, 3.0, 2.8, M.threadLilac);
    this.spool(4.6, 21.6, -50.3, 2.2, 2.4, M.threadMint);
    this.spool(8.2, 23.2, -54.6, 2.0, 2.4, M.threadButter);
    this.addCollectible(4.6, 22.6, -50.3);
    this.addCheckpoint(8.2, 23.2, -54.6, 'Spool Climb');
    this.bunting([0, 21.4, -46], [8.2, 24.6, -54.6], 1.3);

    /* --- 6. star balls --- */
    const ballDefs = [
      [5.0, 24.6, -58.0, 1.7, M.knitPeach, 0.0],
      [1.5, 26.0, -61.0, 1.7, M.knitBlue, 1.5],
    ];
    ballDefs.forEach(([x, y, z, r, mat, ph]) => {
      const col = this.addCyl(x, y, z, r * 0.8, 2.0, mat, {
        move: { axis: 'y', amp: 0.4, speed: 1.1, phase: ph }, seg: 20,
      });
      col.mesh.visible = false;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
      const holder = new THREE.Group();
      holder.add(ball);
      holder.position.copy(col.pos);
      ball.position.set(0, -r + 1.0, 0);
      this.group.add(holder);
      col.visual = holder;
      holder.userData.spin = 0.004;
      this.spinners.push(holder);
    });
    this.addCollectible(1.5, 27.7, -61.0);

    /* --- 7. the silver needle bridge --- */
    const needle = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.36, 13, 14), M.metal);
    shaft.rotation.x = Math.PI / 2;
    needle.add(shaft);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.2, 10, 26), M.metal);
    eye.position.z = -6;
    eye.rotation.y = Math.PI / 2;
    needle.add(eye);
    needle.position.set(1.5, 27.4, -70.5);
    this.group.add(needle);
    this.addBox(1.5, 27.9, -70.5, 1.4, 0.4, 12.6, M.linen, {});

    /* --- 8. the moon summit --- */
    const summitY = 28.6;
    this.addCyl(1.5, summitY, -83, 5, 2.2, M.feltCream, { seg: 40 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(2.0, 16, 12), M.feltLilac);
      petal.position.set(1.5 + Math.cos(a) * 5.1, summitY - 0.9, -83 + Math.sin(a) * 5.1);
      petal.scale.set(1.2, 0.4, 1.2);
      petal.castShadow = true;
      this.group.add(petal);
    }
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 26, 14), M.feltMoss);
    stalk.position.set(1.5, summitY - 14, -83);
    this.group.add(stalk);
    this.addCheckpoint(-1.4, summitY, -81, 'Moon Summit');
    this.addCollectible(3.8, summitY + 1.2, -84.5);
    this.addCollectible(-0.8, summitY + 1.2, -84.5);
    this.bunting([-4, summitY + 4, -83], [7, summitY + 4, -83], 1.5);

    const goal = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 1.7, 24, 1, true), M.moonMetal);
    cup.position.y = 0.85;
    goal.add(cup);
    const domeG = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.moonMetal);
    domeG.position.y = 1.7;
    goal.add(domeG);
    for (let ring = 0; ring < 3; ring++) {
      const dimple = new THREE.Mesh(new THREE.TorusGeometry(0.85 - ring * 0.03, 0.045, 6, 24), M.moonMetal);
      dimple.rotation.x = Math.PI / 2;
      dimple.position.y = 0.47 + ring * 0.42;
      goal.add(dimple);
    }
    goal.position.set(1.5, summitY + 0.4, -83);
    this.group.add(goal);
    this.goal = { group: goal, pos: new THREE.Vector3(1.5, summitY + 1, -83), reached: false };
    this.addCyl(1.5, summitY + 0.4, -83, 1.3, 0.8, M.knitBlue, { seg: 20 });

    const moonGlow = new THREE.PointLight(0xcfe0ff, 1.2, 20, 2);
    moonGlow.position.set(1.5, summitY + 4, -83);
    this.group.add(moonGlow);

    const cloudDefs = [
      [-14, 8, -18, 1.1], [12, 12, -30, 1.3], [-16, 16, -42, 1.2],
      [14, 20, -55, 1.0], [-12, 24, -65, 1.3], [10, 27, -75, 1.1],
      [-10, 29, -85, 1.4],
    ];
    for (const [x, y, z, s] of cloudDefs) {
      const c = this.cloud(x, y, z, s);
      this.movers.push({
        col: { pos: c.position, mesh: c }, base: c.position.clone(), axis: 'x',
        amp: 1.6 + Math.random() * 1.8, speed: 0.12 + Math.random() * 0.12,
        phase: Math.random() * 6, delta: new THREE.Vector3(),
      });
    }
  }

}
