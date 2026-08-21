/* ------------------------------------------------------------------
   The character roster. Every skin reuses the same knitted-toy build
   (round body, long dangly limbs, pink thread collar) — only the
   yarn colours and ear shape change, so unlocking a new friend never
   needs new geometry, just new wool.
------------------------------------------------------------------ */

export const CHARACTERS = [
  {
    id: 'bramble',
    name: 'Bramble',
    price: 0,
    blurb: 'The original. White head, blue marled yarn, a pink thread bow.',
    headHex: '#ffffff', headAccent: '#e8f1f7',
    bodyHex: '#4faee6', bodyAccent: '#46a5df', limbHex: '#4aa9e2',
    collarHex: '#f7a9bd',
    earShape: 'round',
    swatch: ['#ffffff', '#4faee6'],
  },
  {
    id: 'evalina',
    name: 'Evalina',
    price: 150,
    blurb: 'A lilac bunny with long floppy ears and a lavender ribbon.',
    headHex: '#fffdfb', headAccent: '#f2eaf9',
    bodyHex: '#b79ee0', bodyAccent: '#ad91da', limbHex: '#b195dc',
    collarHex: '#dcaee8',
    earShape: 'long',
    swatch: ['#fffdfb', '#b79ee0'],
  },
  {
    id: 'clementine',
    name: 'Clementine',
    price: 220,
    blurb: 'A peachy fox with pointed ears and a mint green thread.',
    headHex: '#fff3e8', headAccent: '#ffe1c9',
    bodyHex: '#f2a15e', bodyAccent: '#ee9750', limbHex: '#f0a563',
    collarHex: '#a8d9b0',
    earShape: 'pointed',
    swatch: ['#fff3e8', '#f2a15e'],
  },
  {
    id: 'marina',
    name: 'Marina',
    price: 260,
    blurb: 'A minty little seal with round flippy ears and a coral thread.',
    headHex: '#f4fffa', headAccent: '#dff5ec',
    bodyHex: '#7fcfb0', bodyAccent: '#6cc2a2', limbHex: '#74c8a8',
    collarHex: '#f4a68f',
    earShape: 'round',
    swatch: ['#f4fffa', '#7fcfb0'],
  },
];

export const DEFAULT_CHARACTER = 'bramble';

export function findCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
