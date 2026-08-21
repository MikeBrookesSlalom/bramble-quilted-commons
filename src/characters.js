/* ------------------------------------------------------------------
   The character roster. Every skin shares one animation rig, but
   "species" picks a genuinely different body — a bear, a bunny in a
   crochet dress, a fox with a tail, a flippered seal — not just a
   recolour of the same shape.
------------------------------------------------------------------ */

export const CHARACTERS = [
  {
    id: 'bramble',
    name: 'Bramble',
    price: 0,
    blurb: 'The original bear. White head, blue marled yarn, a pink thread bow.',
    species: 'bear',
    headHex: '#ffffff', headAccent: '#e8f1f7',
    bodyHex: '#4faee6', bodyAccent: '#46a5df', limbHex: '#4aa9e2',
    collarHex: '#f7a9bd',
    swatch: ['#ffffff', '#4faee6'],
  },
  {
    id: 'evalina',
    name: 'Evalina',
    price: 150,
    blurb: 'A pink bunny with a bow in her ears and a little crochet dress.',
    species: 'bunny',
    headHex: '#fffdfb', headAccent: '#fce6f0',
    bodyHex: '#f28fb8', bodyAccent: '#ee7aa8', limbHex: '#f28fb8',
    collarHex: '#e0559a', dressHex: '#f6a8cc', bowHex: '#e0559a',
    swatch: ['#fffdfb', '#f28fb8'],
  },
  {
    id: 'clementine',
    name: 'Clementine',
    price: 220,
    blurb: 'A peachy fox with pointed ears, a bushy tail and a cream belly.',
    species: 'fox',
    headHex: '#fff3e8', headAccent: '#ffe1c9',
    bodyHex: '#f2a15e', bodyAccent: '#ee9750', limbHex: '#f0a563',
    collarHex: '#a8d9b0',
    swatch: ['#fff3e8', '#f2a15e'],
  },
  {
    id: 'marina',
    name: 'Marina',
    price: 260,
    blurb: 'A minty little seal with tiny ears and flippers instead of paws.',
    species: 'seal',
    headHex: '#f4fffa', headAccent: '#dff5ec',
    bodyHex: '#7fcfb0', bodyAccent: '#6cc2a2', limbHex: '#74c8a8',
    collarHex: '#f4a68f',
    swatch: ['#f4fffa', '#7fcfb0'],
  },
];

export const DEFAULT_CHARACTER = 'bramble';

export function findCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
