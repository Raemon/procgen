import {
  blankSpriteCanvas,
  blendPixel,
  paintPixel,
  paintRect,
  spriteArtOf,
  type SpriteCanvas,
} from '../paint/spriteCanvas';
import { packHex } from '@/features/asset-library/tiles/art/packedHex';
import type { SpriteArt } from '@/features/asset-library/tiles/spriteArt';

export const SIZE = 48;
const CENTER = SIZE / 2;

function hash01(x: number, y: number, salt: number): number {
  let h = Math.imul(x + 11, 374761393) ^ Math.imul(y + 7, 668265263) ^ Math.imul(salt + 3, 962287);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function glow(canvas: SpriteCanvas, x: number, y: number, core: string, halo: string): void {
  paintPixel(canvas, x, y, core);
  const packedHalo = packHex(halo);
  blendPixel(canvas, x - 1, y, packedHalo, 0.6);
  blendPixel(canvas, x + 1, y, packedHalo, 0.6);
  blendPixel(canvas, x, y - 1, packedHalo, 0.6);
  blendPixel(canvas, x, y + 1, packedHalo, 0.6);
}

interface RowShades {
  base: string;
  shadow: string;
  lit: string;
}

function shadedRow(canvas: SpriteCanvas, y: number, left: number, width: number, ink: RowShades): void {
  if (width <= 0) return;
  paintRect(canvas, left, y, width, 1, ink.base);
  paintPixel(canvas, left, y, ink.lit);
  if (width > 1) paintPixel(canvas, left + width - 1, y, ink.shadow);
  if (width > 5) paintPixel(canvas, left + width - 2, y, ink.shadow);
}

// ---------------------------------------------------------------- A: hollow wraith
export function hollowWraith(): SpriteArt {
  const canvas = blankSpriteCanvas(SIZE);
  const shroud: RowShades = { base: '#2e3547', shadow: '#1b202e', lit: '#4a5470' };
  const wisp = packHex('#39415a');

  // hood dome
  for (let y = 5; y <= 13; y++) {
    const halfWidth = Math.round(3 + (y - 5) * 0.55);
    shadedRow(canvas, y, CENTER - halfWidth, halfWidth * 2, shroud);
  }
  // face void under the hood
  paintRect(canvas, CENTER - 3, 10, 6, 5, '#06070c');
  paintRect(canvas, CENTER - 4, 11, 8, 3, '#06070c');
  glow(canvas, CENTER - 2, 12, '#d8f2ff', '#5f88a8');
  glow(canvas, CENTER + 1, 12, '#d8f2ff', '#5f88a8');

  // shoulders and torso taper
  for (let y = 14; y <= 30; y++) {
    const along = (y - 14) / 16;
    const halfWidth = Math.round(8 - along * 2.5);
    shadedRow(canvas, y, CENTER - halfWidth, halfWidth * 2, shroud);
  }
  // skirt flare
  for (let y = 31; y <= 38; y++) {
    const along = (y - 31) / 7;
    const halfWidth = Math.round(5.5 + along * 3.5);
    shadedRow(canvas, y, CENTER - halfWidth, halfWidth * 2, shroud);
  }
  // ragged hem strips with gaps between them
  for (let x = CENTER - 9; x <= CENTER + 8; x++) {
    const drop = Math.floor(hash01(x, 0, 1) * 6);
    if (hash01(x, 1, 2) < 0.25) continue;
    for (let y = 39; y <= 39 + drop; y++) {
      paintPixel(canvas, x, y, (39 + drop - y) < 2 ? shroud.shadow : shroud.base);
    }
  }
  // drifting wisps off the shoulders
  for (const [x, y, alpha] of [
    [CENTER - 11, 17, 0.8], [CENTER - 12, 19, 0.55], [CENTER - 13, 22, 0.35],
    [CENTER + 10, 20, 0.8], [CENTER + 11, 23, 0.55], [CENTER + 12, 26, 0.35],
    [CENTER - 11, 33, 0.5], [CENTER + 10, 35, 0.5],
  ] as const) {
    blendPixel(canvas, x, y, wisp, alpha);
  }
  // folded arms hinted as darker creases
  paintRect(canvas, CENTER - 5, 18, 1, 9, shroud.shadow);
  paintRect(canvas, CENTER + 4, 18, 1, 9, shroud.shadow);
  return spriteArtOf(canvas);
}

// ---------------------------------------------------------------- B: veiled mourner
export function veiledMourner(): SpriteArt {
  const canvas = blankSpriteCanvas(SIZE);
  const veil: RowShades = { base: '#c9c2b2', shadow: '#8d8778', lit: '#e8e2d2' };
  const robe: RowShades = { base: '#15151c', shadow: '#0a0a10', lit: '#26262f' };

  // veil crown
  for (let y = 4; y <= 9; y++) {
    const halfWidth = Math.round(2.5 + (y - 4) * 0.7);
    shadedRow(canvas, y, CENTER - halfWidth, halfWidth * 2, veil);
  }
  // veil falling over the shoulders, parted in front
  for (let y = 10; y <= 24; y++) {
    const along = (y - 10) / 14;
    const outer = Math.round(6 + along * 1.5);
    const inner = y <= 13 ? 0 : Math.round(2 + along * 2);
    shadedRow(canvas, y, CENTER - outer, inner === 0 ? outer * 2 : outer - inner, veil);
    if (inner > 0) shadedRow(canvas, y, CENTER + inner, outer - inner, veil);
  }
  // ragged veil ends
  for (const side of [-1, 1]) {
    for (let x = 5; x <= 7; x++) {
      const column = CENTER + side * x - (side < 0 ? 1 : 0);
      const drop = Math.floor(hash01(column, 2, 5) * 4);
      for (let y = 25; y <= 25 + drop; y++) paintPixel(canvas, column, y, veil.shadow);
    }
  }
  // the dark where a face should be: veil hangs over nothing
  paintRect(canvas, CENTER - 2, 11, 4, 6, '#050508');
  paintPixel(canvas, CENTER - 2, 13, '#2b2b38');
  paintPixel(canvas, CENTER + 1, 13, '#2b2b38');

  // black under-robe falling straight to a hovering hem
  for (let y = 14; y <= 41; y++) {
    const along = (y - 14) / 27;
    const halfWidth = Math.round(3 + along * 3);
    shadedRow(canvas, y, CENTER - halfWidth, halfWidth * 2, robe);
  }
  for (let x = CENTER - 6; x <= CENTER + 5; x++) {
    if (hash01(x, 3, 7) < 0.3) continue;
    paintPixel(canvas, x, 42, robe.shadow);
  }
  // long pale hands clasped at the waist
  paintRect(canvas, CENTER - 1, 26, 1, 4, veil.base);
  paintRect(canvas, CENTER, 27, 1, 4, veil.shadow);
  paintPixel(canvas, CENTER - 1, 30, veil.shadow);
  return spriteArtOf(canvas);
}

// ---------------------------------------------------------------- C: the gaunt one
export function gauntOne(): SpriteArt {
  const canvas = blankSpriteCanvas(SIZE);
  const body: RowShades = { base: '#181a17', shadow: '#0c0d0b', lit: '#2c2f28' };
  const antler = '#4d4438';
  const antlerDark = '#332d24';
  const bone = '#8d8674';

  // antler crown
  for (const side of [-1, 1]) {
    const rootX = CENTER + (side < 0 ? -2 : 1);
    for (let step = 0; step < 7; step++) {
      const x = rootX + side * Math.round(step * 0.8);
      const y = 9 - step;
      paintPixel(canvas, x, y, step > 4 ? antlerDark : antler);
      if (step === 2 || step === 4) {
        paintPixel(canvas, x + side, y - 1, antlerDark);
        paintPixel(canvas, x + side, y - 2, antlerDark);
      }
    }
  }
  // narrow skull
  for (let y = 10; y <= 14; y++) shadedRow(canvas, y, CENTER - 3, 6, body);
  paintPixel(canvas, CENTER - 2, 15, body.base);
  paintPixel(canvas, CENTER + 1, 15, body.base);
  glow(canvas, CENTER - 2, 12, '#e6ffd9', '#556b4a');
  glow(canvas, CENTER + 1, 12, '#e6ffd9', '#556b4a');

  // wasted torso with rib glints
  for (let y = 16; y <= 27; y++) {
    const halfWidth = y <= 18 ? 4 : 3;
    shadedRow(canvas, y, CENTER - halfWidth, halfWidth * 2, body);
    if (y >= 19 && y <= 25 && y % 2 === 1) {
      paintPixel(canvas, CENTER - 2, y, bone);
      paintPixel(canvas, CENTER + 1, y, bone);
    }
  }
  // arms reaching past the knees, fingers splayed
  for (const side of [-1, 1]) {
    const shoulderX = CENTER + side * 4 - (side < 0 ? 0 : 1);
    for (let y = 17; y <= 33; y++) {
      const drift = Math.round((y - 17) * 0.18);
      paintPixel(canvas, shoulderX + side * drift, y, y > 30 ? body.lit : body.base);
    }
    const handX = shoulderX + side * 3;
    for (const finger of [-1, 0, 1]) {
      paintPixel(canvas, handX + finger, 34, body.lit);
      paintPixel(canvas, handX + finger, 35, bone);
    }
  }
  // stilted legs with a backward crook
  for (const side of [-1, 1]) {
    const hipX = CENTER + side * 2 - (side < 0 ? 0 : 1);
    for (let y = 28; y <= 36; y++) paintPixel(canvas, hipX, y, body.base);
    for (let y = 37; y <= 43; y++) paintPixel(canvas, hipX + side, y, body.base);
    paintPixel(canvas, hipX + side, 44, body.lit);
    paintPixel(canvas, hipX + side * 2, 44, body.lit);
  }
  return spriteArtOf(canvas);
}

// ---------------------------------------------------------------- D: drowned watcher
export function drownedWatcher(): SpriteArt {
  const canvas = blankSpriteCanvas(SIZE);
  const strips = ['#16211c', '#1d2b24', '#0e1613', '#24352c'];
  const stripShadow = '#0a100d';
  const eye = '#b9ffd8';
  const eyeHalo = '#3f6b52';

  // a hanging mass of waterlogged strips
  for (let x = CENTER - 8; x <= CENTER + 7; x++) {
    const offset = Math.abs(x - CENTER + 0.5);
    const top = 6 + Math.round(offset * offset * 0.28) + Math.floor(hash01(x, 4, 11) * 3);
    const bottom = 40 - Math.round(offset * 0.6) + Math.floor(hash01(x, 5, 13) * 5) - 2;
    const stripInk = strips[Math.floor(hash01(x, 6, 17) * strips.length)]!;
    for (let y = top; y <= bottom; y++) {
      const torn = hash01(x, y, 19) < 0.05 && y > top + 6 && y < bottom - 4;
      if (torn) continue;
      paintPixel(canvas, x, y, y > bottom - 2 || y < top + 2 ? stripShadow : stripInk);
    }
  }
  // kelp strands hanging past the crown
  for (const [x, top, length] of [
    [CENTER - 6, 4, 6], [CENTER - 1, 2, 5], [CENTER + 4, 3, 7],
  ] as const) {
    for (let y = top; y < top + length; y++) paintPixel(canvas, x, y, '#101a15');
  }
  // scattered unblinking eyes
  glow(canvas, CENTER - 4, 14, eye, eyeHalo);
  glow(canvas, CENTER + 3, 12, eye, eyeHalo);
  glow(canvas, CENTER + 5, 21, eye, eyeHalo);
  glow(canvas, CENTER - 6, 24, eye, eyeHalo);
  glow(canvas, CENTER - 1, 18, eye, eyeHalo);
  paintPixel(canvas, CENTER - 1, 18, '#eafff3');
  // drips falling under the hem
  for (const [x, y] of [
    [CENTER - 5, 44], [CENTER - 5, 45], [CENTER + 2, 43], [CENTER + 6, 44], [CENTER - 1, 46],
  ] as const) {
    blendPixel(canvas, x, y, packHex('#2a3f34'), 0.8);
  }
  return spriteArtOf(canvas);
}

export const DESIGNS = [
  {
    key: 'A',
    name: 'Hollow Wraith',
    note: 'Hooded shroud around an empty face, cold blue-gray cloth, ragged floating hem, wisps trailing off the shoulders.',
    art: hollowWraith,
  },
  {
    key: 'B',
    name: 'Veiled Mourner',
    note: 'Bone-pale funeral veil parted over darkness where a face should be, black under-robe hovering above the ground, thin clasped hands.',
    art: veiledMourner,
  },
  {
    key: 'C',
    name: 'The Gaunt One',
    note: 'Near-black emaciated stilt-walker with a branching antler crown, rib glints, splayed fingers past its knees, pinprick green eyes.',
    art: gauntOne,
  },
  {
    key: 'D',
    name: 'Drowned Watcher',
    note: 'A hanging mass of waterlogged rag-strips crowned with kelp, studded with unblinking pale-green eyes, dripping as it moves.',
    art: drownedWatcher,
  },
];
