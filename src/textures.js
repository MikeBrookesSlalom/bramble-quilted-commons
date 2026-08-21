import * as THREE from 'three';

/* ------------------------------------------------------------------
   Procedural fabric texture workshop.
   Everything in this world is knitted, felted, woven or stitched, so
   every texture is painted here on a 2D canvas and reused as a map.
------------------------------------------------------------------ */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// smooth-ish value noise on a grid, used for marled yarn clumps
function noiseField(w, h, seed, scale = 0.35) {
  const rand = mulberry32(seed);
  const gw = Math.max(2, Math.ceil(w * scale));
  const gh = Math.max(2, Math.ceil(h * scale));
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = rand();
  return (x, y) => {
    const fx = (x / w) * (gw - 1);
    const fy = (y / h) * (gh - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = g[y0 * gw + x0], b = g[y0 * gw + x1];
    const c = g[y1 * gw + x0], d = g[y1 * gw + x1];
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
  };
}

function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function toTexture(canvas, repeat = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// derive a grey height-ish map from a colour canvas so stitches catch light
function bumpFrom(canvas, repeat = 1) {
  const c = makeCanvas(canvas.width);
  const ctx = c.getContext('2d');
  ctx.filter = 'grayscale(1) contrast(2.2) brightness(1.1)';
  ctx.drawImage(canvas, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return '#' + c.getHexString();
}

/* ---------------- chunky knit (the bear's own yarn) ---------------- */

export function knitCanvas({
  size = 512, cols = 9, rows = 11, seed = 7,
  yarnA = '#ffffff', yarnB = '#5cb8ea', blend = 0.5, fuzz = 0.5, marl = 0.03,
} = {}) {
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  const rand = mulberry32(seed);
  const noise = noiseField(size, size, seed + 3, marl);

  ctx.fillStyle = shade(yarnA, -0.12);
  ctx.fillRect(0, 0, size, size);

  const cw = size / cols;
  const ch = size / rows;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // each stitch is a fat "V" of yarn, drawn twice for a plump highlight
  for (let r = -1; r <= rows; r++) {
    for (let col = -1; col <= cols; col++) {
      const x = col * cw + (r % 2 ? cw * 0.5 : 0);
      const y = r * ch;
      const n = noise(((x % size) + size) % size, ((y % size) + size) % size);
      const useB = n > blend;
      const base = useB ? yarnB : yarnA;
      const jitter = (rand() - 0.5) * 0.06;

      ctx.strokeStyle = shade(base, -0.13 + jitter);
      ctx.lineWidth = cw * 0.62;
      ctx.beginPath();
      ctx.moveTo(x, y + ch * 1.02);
      ctx.quadraticCurveTo(x + cw * 0.28, y + ch * 0.18, x + cw * 0.5, y + ch * 0.42);
      ctx.quadraticCurveTo(x + cw * 0.72, y + ch * 0.18, x + cw, y + ch * 1.02);
      ctx.stroke();

      ctx.strokeStyle = shade(base, 0.1 + jitter);
      ctx.lineWidth = cw * 0.3;
      ctx.beginPath();
      ctx.moveTo(x + cw * 0.08, y + ch * 0.92);
      ctx.quadraticCurveTo(x + cw * 0.3, y + ch * 0.26, x + cw * 0.5, y + ch * 0.48);
      ctx.quadraticCurveTo(x + cw * 0.7, y + ch * 0.26, x + cw * 0.92, y + ch * 0.92);
      ctx.stroke();
    }
  }

  // halo of loose fibres — chenille yarn is never tidy
  ctx.globalAlpha = 0.16 * fuzz;
  for (let i = 0; i < size * 1.6; i++) {
    const x = rand() * size, y = rand() * size;
    const a = rand() * Math.PI * 2;
    const len = 2 + rand() * 7;
    ctx.strokeStyle = rand() > 0.5 ? '#ffffff' : shade(yarnB, -0.2);
    ctx.lineWidth = 1 + rand();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

/* ---------------- felt: matte, speckled, slightly hairy ---------------- */

export function feltCanvas({ size = 256, color = '#e8b7cf', seed = 11, speck = 1 } = {}) {
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  const rand = mulberry32(seed);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size * 12 * speck; i++) {
    const x = rand() * size, y = rand() * size;
    ctx.fillStyle = rand() > 0.5 ? shade(color, 0.06) : shade(color, -0.07);
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x, y, rand() * 1.8 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < size * 1.2; i++) {
    const x = rand() * size, y = rand() * size, a = rand() * Math.PI * 2;
    ctx.strokeStyle = rand() > 0.5 ? shade(color, 0.16) : shade(color, -0.16);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * (3 + rand() * 6), y + Math.sin(a) * (3 + rand() * 6));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

/* ---------------- plain woven linen / canvas ---------------- */

export function weaveCanvas({ size = 256, color = '#dfd0b4', seed = 5, threads = 26 } = {}) {
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  const rand = mulberry32(seed);
  ctx.fillStyle = shade(color, -0.1);
  ctx.fillRect(0, 0, size, size);
  const step = size / threads;
  for (let i = 0; i < threads; i++) {
    ctx.fillStyle = shade(color, 0.05 + (rand() - 0.5) * 0.08);
    ctx.fillRect(0, i * step, size, step * 0.62);
    ctx.fillStyle = shade(color, -0.02 + (rand() - 0.5) * 0.08);
    ctx.globalAlpha = 0.55;
    ctx.fillRect(i * step, 0, step * 0.62, size);
    ctx.globalAlpha = 1;
  }
  return c;
}

/* ---------------- patchwork quilt with running-stitch seams ---------------- */

export function quiltCanvas({ size = 1024, seed = 3, palette } = {}) {
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  const rand = mulberry32(seed);
  const cols = palette || ['#f6d7b0', '#cbe4c4', '#f3c0c8', '#bcd9ee', '#eadfc0', '#d9c8e8', '#f7e9c9', '#a9d3c2'];
  const n = 4;
  const cell = size / n;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const col = cols[Math.floor(rand() * cols.length)];
      ctx.fillStyle = col;
      ctx.fillRect(x * cell, y * cell, cell, cell);

      const motif = Math.floor(rand() * 4);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x * cell, y * cell, cell, cell);
      ctx.clip();
      ctx.strokeStyle = shade(col, -0.14);
      ctx.fillStyle = shade(col, -0.12);
      ctx.lineWidth = cell * 0.045;
      if (motif === 0) {
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.moveTo(x * cell + i * cell / 6, y * cell);
          ctx.lineTo(x * cell + i * cell / 6, y * cell + cell);
          ctx.stroke();
        }
      } else if (motif === 1) {
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.arc(x * cell + (i + 0.5) * cell / 5, y * cell + (j + 0.5) * cell / 5, cell * 0.045, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (motif === 2) {
        for (let i = -6; i < 7; i++) {
          ctx.beginPath();
          ctx.moveTo(x * cell + i * cell / 5, y * cell);
          ctx.lineTo(x * cell + i * cell / 5 + cell, y * cell + cell);
          ctx.stroke();
        }
      } else {
        // little daisy embroidery
        for (let i = 0; i < 3; i++) {
          const cx = x * cell + rand() * cell, cy = y * cell + rand() * cell;
          ctx.fillStyle = '#fff6e6';
          for (let p = 0; p < 6; p++) {
            const a = (p / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(a) * cell * 0.05, cy + Math.sin(a) * cell * 0.05, cell * 0.032, cell * 0.018, a, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#f0b64b';
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.026, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // running stitch along the seams
      ctx.setLineDash([cell * 0.05, cell * 0.045]);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = cell * 0.022;
      ctx.strokeRect(x * cell + cell * 0.03, y * cell + cell * 0.03, cell * 0.94, cell * 0.94);
      ctx.setLineDash([]);
    }
  }
  return c;
}

/* ---------------- a wound bobbin of thread ---------------- */

export function threadCanvas({ size = 256, color = '#f2a0b5', seed = 9 } = {}) {
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  const rand = mulberry32(seed);
  ctx.fillStyle = shade(color, -0.15);
  ctx.fillRect(0, 0, size, size);
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 260; i++) {
    const y = rand() * size;
    ctx.strokeStyle = shade(color, (rand() - 0.4) * 0.25);
    ctx.beginPath();
    ctx.moveTo(-10, y);
    ctx.lineTo(size + 10, y + (rand() - 0.5) * 22);
    ctx.stroke();
  }
  return c;
}

/* ---------------- material helpers ---------------- */

export function fabricMaterial(canvas, { repeat = 1, bump = 0.35, roughness = 0.98, color = 0xffffff, ...rest } = {}) {
  return new THREE.MeshStandardMaterial({
    map: toTexture(canvas, repeat),
    bumpMap: bumpFrom(canvas, repeat),
    bumpScale: bump,
    roughness,
    metalness: 0,
    color,
    ...rest,
  });
}

export function makeTexture(canvas, repeat = 1) {
  return toTexture(canvas, repeat);
}

/* ---------------- soft pastel sky, painted like dyed cloth ---------------- */

export function skyTexture() {
  const c = makeCanvas(512);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#bfe4f5');
  g.addColorStop(0.45, '#dff0f7');
  g.addColorStop(0.72, '#fbe8dd');
  g.addColorStop(1.0, '#f7d9c8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const rand = mulberry32(21);
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rand() > 0.5 ? '#ffffff' : '#9fc7dd';
    ctx.fillRect(rand() * 512, rand() * 512, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
