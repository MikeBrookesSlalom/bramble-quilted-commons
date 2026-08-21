import { Game } from './game.js';

const ui = {
  total: 0,
  countEl: document.getElementById('count'),
  toastEl: document.getElementById('toast'),
  hintEl: document.getElementById('hint'),
  winEl: document.getElementById('win'),
  hintHidden: false,
  toastTimer: 0,

  setTotal(n) { this.total = n; this.setCount(0); },
  setCount(n) { this.countEl.textContent = `${n} / ${this.total}`; },

  toast(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 2600);
  },

  hideHintOnce() {
    if (this.hintHidden) return;
    this.hintHidden = true;
    setTimeout(() => { this.hintEl.style.opacity = '0'; }, 7000);
  },

  win(collected, total) {
    document.getElementById('wincount').textContent =
      collected >= total
        ? `And every single button — all ${total} of them. Perfect stitching!`
        : `You gathered ${collected} of ${total} buttons along the way.`;
    this.winEl.classList.add('show');
  },
};

const canvas = document.getElementById('scene');
const game = new Game(canvas, ui);
game.loop();

// handy for tinkering from the console: game.pos.set(x, y, z)
window.game = game;

const titleEl = document.getElementById('title');
document.getElementById('play').addEventListener('click', () => {
  titleEl.style.opacity = '0';
  setTimeout(() => { titleEl.style.display = 'none'; }, 600);
  game.start();
  ui.hideHintOnce();
  canvas.focus();
});

document.getElementById('keepgoing').addEventListener('click', () => {
  document.getElementById('win').classList.remove('show');
});

document.getElementById('respawnBtn').addEventListener('click', () => game.respawn());

/* ---------------- touch controls (iPad / phone) ---------------- */

const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');

// virtual joystick: drag the knob, read out an -1..1 vector per axis
const joyZone = document.getElementById('joystickZone');
const joyKnob = document.getElementById('joystickKnob');
const JOY_RADIUS = 42;
let joyPointerId = null;
let joyCenter = { x: 0, y: 0 };

function joyUpdate(clientX, clientY) {
  let dx = clientX - joyCenter.x;
  let dy = clientY - joyCenter.y;
  const dist = Math.hypot(dx, dy);
  if (dist > JOY_RADIUS) { dx = (dx / dist) * JOY_RADIUS; dy = (dy / dist) * JOY_RADIUS; }
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  // up on the stick (negative dy) means "forward", matching W
  game.setMoveAxis(dx / JOY_RADIUS, -dy / JOY_RADIUS);
}

joyZone.addEventListener('pointerdown', (e) => {
  joyPointerId = e.pointerId;
  try { joyZone.setPointerCapture(joyPointerId); } catch {}
  const rect = joyZone.getBoundingClientRect();
  joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  joyUpdate(e.clientX, e.clientY);
  ui.hideHintOnce();
  e.preventDefault();
});
joyZone.addEventListener('pointermove', (e) => {
  if (e.pointerId !== joyPointerId) return;
  joyUpdate(e.clientX, e.clientY);
  e.preventDefault();
});
const joyEnd = (e) => {
  if (e.pointerId !== joyPointerId) return;
  joyPointerId = null;
  joyKnob.style.transform = 'translate(0px, 0px)';
  game.setMoveAxis(0, 0);
};
joyZone.addEventListener('pointerup', joyEnd);
joyZone.addEventListener('pointercancel', joyEnd);

// jump button: held down = full hop (release early for a short hop), a
// fresh tap while airborne triggers the flutter, exactly like Space
const jumpBtn = document.getElementById('jumpBtn');
jumpBtn.addEventListener('pointerdown', (e) => {
  try { jumpBtn.setPointerCapture(e.pointerId); } catch {}
  jumpBtn.classList.add('active');
  game.pressJump();
  e.preventDefault();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) =>
  jumpBtn.addEventListener(evt, () => {
    jumpBtn.classList.remove('active');
    game.releaseJump();
  })
);
