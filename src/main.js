import { Game } from './game.js';
import { CHARACTERS, findCharacter } from './characters.js';
import { getCurrency, getUnlocked, getSelected, setSelected, unlock, spendCurrency } from './progress.js';

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

  win({ collected, total, earned, totalCurrency, levelName, hasNextLevel, isFinal }) {
    const name = findCharacter(getSelected()).name;
    document.getElementById('winline').textContent = `${name} sits at the very top of ${levelName}.`;
    document.getElementById('wincount').textContent =
      collected >= total
        ? `And every single button — all ${total} of them. Perfect stitching!`
        : `You gathered ${collected} of ${total} buttons along the way.`;
    document.getElementById('winearned').textContent = `You earned ${earned} 🧵 spools — ${totalCurrency} saved up.`;
    document.getElementById('winNextLevelBtn').style.display = hasNextLevel ? '' : 'none';
    document.getElementById('winResetBtn').style.display = isFinal ? '' : 'none';
    this.winEl.classList.add('show');
    renderCurrencyBadge();
  },
};

const canvas = document.getElementById('scene');
const game = new Game(canvas, ui);
game.loop();

// handy for tinkering from the console: game.pos.set(x, y, z)
window.game = game;

/* ---------------- currency + character shop ---------------- */

const currencyBadge = document.getElementById('currencyBadge');
function renderCurrencyBadge() { currencyBadge.textContent = `🧵 ${getCurrency()}`; }
renderCurrencyBadge();

const shopEl = document.getElementById('shop');
const shopGrid = document.getElementById('shopGrid');

function renderShop() {
  const unlocked = getUnlocked();
  const selected = getSelected();
  const currency = getCurrency();
  document.getElementById('shopCurrency').textContent = `🧵 ${currency} spools saved`;

  shopGrid.innerHTML = '';
  CHARACTERS.forEach((c) => {
    const owned = unlocked.includes(c.id);
    const isSelected = selected === c.id;
    const card = document.createElement('div');
    card.className = 'charCard' + (isSelected ? ' selected' : '');

    const swatch = document.createElement('div');
    swatch.className = 'charSwatch';
    swatch.style.background = `linear-gradient(135deg, ${c.swatch[0]}, ${c.swatch[1]})`;
    card.appendChild(swatch);

    const name = document.createElement('div');
    name.className = 'charName';
    name.textContent = c.name;
    card.appendChild(name);

    const blurb = document.createElement('div');
    blurb.className = 'charBlurb';
    blurb.textContent = c.blurb;
    card.appendChild(blurb);

    const btn = document.createElement('button');
    btn.className = 'charBtn';
    if (isSelected) {
      btn.textContent = 'Selected';
      btn.disabled = true;
    } else if (owned) {
      btn.textContent = 'Wear';
      btn.addEventListener('click', () => {
        setSelected(c.id);
        game.setSkin(c.id);
        renderShop();
      });
    } else {
      btn.textContent = c.price === 0 ? 'Unlock' : `Unlock — 🧵 ${c.price}`;
      btn.disabled = currency < c.price;
      btn.addEventListener('click', () => {
        if (getCurrency() < c.price) return;
        spendCurrency(c.price);
        unlock(c.id);
        setSelected(c.id);
        game.setSkin(c.id);
        renderCurrencyBadge();
        renderShop();
      });
    }
    card.appendChild(btn);
    shopGrid.appendChild(card);
  });
}

function openShop() { renderShop(); shopEl.classList.add('show'); }
function closeShop() { shopEl.classList.remove('show'); }
document.getElementById('shopBtn').addEventListener('click', openShop);
document.getElementById('titleShopBtn').addEventListener('click', openShop);
document.getElementById('winShopBtn').addEventListener('click', openShop);
document.getElementById('shopClose').addEventListener('click', closeShop);

const titleEl = document.getElementById('title');
document.getElementById('play').addEventListener('click', () => {
  titleEl.style.opacity = '0';
  setTimeout(() => { titleEl.style.display = 'none'; }, 600);
  game.start();
  if (!musicMuted) game.sound.startMusic();
  ui.hideHintOnce();
  canvas.focus();
});

/* ---------------- music mute toggle ---------------- */

let musicMuted = localStorage.getItem('stitchbear_music_muted') === '1';
const muteBtn = document.getElementById('muteBtn');
function renderMuteBtn() { muteBtn.textContent = musicMuted ? '🔇' : '🎵'; }
renderMuteBtn();
muteBtn.addEventListener('click', () => {
  musicMuted = !musicMuted;
  localStorage.setItem('stitchbear_music_muted', musicMuted ? '1' : '0');
  game.sound.setMusicMuted(musicMuted);
  if (!musicMuted && game.started) game.sound.startMusic();
  renderMuteBtn();
});

document.getElementById('keepgoing').addEventListener('click', () => {
  document.getElementById('win').classList.remove('show');
});

document.getElementById('winNextLevelBtn').addEventListener('click', () => {
  document.getElementById('win').classList.remove('show');
  game.loadLevel(2);
  ui.toast('Level 2 — The Midnight Mending Loft');
});

document.getElementById('winResetBtn').addEventListener('click', () => {
  document.getElementById('win').classList.remove('show');
  game.loadLevel(1);
  ui.toast('Back to The Quilted Commons — your spools are safe!');
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
