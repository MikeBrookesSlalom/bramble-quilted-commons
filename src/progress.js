import { DEFAULT_CHARACTER } from './characters.js';

/* Small persistence layer over localStorage: spools earned, which
   characters are unlocked, and which one is currently worn. */

const KEYS = {
  currency: 'stitchbear_currency',
  unlocked: 'stitchbear_unlocked',
  selected: 'stitchbear_selected',
};

export function getCurrency() {
  return parseInt(localStorage.getItem(KEYS.currency) || '0', 10) || 0;
}

export function addCurrency(amount) {
  const total = getCurrency() + amount;
  localStorage.setItem(KEYS.currency, String(total));
  return total;
}

export function spendCurrency(amount) {
  const total = Math.max(0, getCurrency() - amount);
  localStorage.setItem(KEYS.currency, String(total));
  return total;
}

export function getUnlocked() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.unlocked) || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch {}
  return [DEFAULT_CHARACTER];
}

export function unlock(id) {
  const set = new Set(getUnlocked());
  set.add(id);
  localStorage.setItem(KEYS.unlocked, JSON.stringify([...set]));
}

export function getSelected() {
  return localStorage.getItem(KEYS.selected) || DEFAULT_CHARACTER;
}

export function setSelected(id) {
  localStorage.setItem(KEYS.selected, id);
}
