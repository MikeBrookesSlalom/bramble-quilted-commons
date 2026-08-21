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
