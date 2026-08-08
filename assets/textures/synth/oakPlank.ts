import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { cellHash01, synthSeed } from '../synthSeeds';
import { wrappedFbm, wrappedValueNoise } from '../wrappedNoise';

const SEED = synthSeed('oakPlank', 'base');
const HONEY: Rgb = [142, 112, 74];
const UMBER: Rgb = [98, 76, 52];
const PLANKS = 5;

export const oakPlank: MaterialSynth = sameOnEveryFace('oakPlank', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const plank = plankRowAt(x, y);
  const grain = grainAt(x, y, plank.id);
  const tinted = mixed(HONEY, UMBER, plank.id * 0.45 + grain * 0.45);
  const gapDark = plank.gap < 0.09 ? 0.55 + 4 * plank.gap : 1;
  const knot = knotAt(x, y, plank.id);
  return grimed(shaded(mixed(tinted, UMBER, knot), gapDark), x, y, SEED + 9, 0.35);
}

function heightAt(x: number, y: number): number {
  const plank = plankRowAt(x, y);
  const seam = Math.min(1, plank.gap / 0.09);
  return 0.35 + 0.5 * seam + 0.15 * grainAt(x, y, plank.id);
}

function plankRowAt(x: number, y: number): { id: number; gap: number } {
  const row = Math.floor(y * PLANKS);
  const rowFrac = y * PLANKS - row;
  const buttShift = cellHash01(row, 0, SEED);
  const buttFrac = (x + buttShift) % 1;
  const gap = Math.min(Math.min(rowFrac, 1 - rowFrac), Math.min(buttFrac, 1 - buttFrac) * PLANKS * 0.6);
  return { id: cellHash01(Math.floor(x + buttShift) + row * 7, row, SEED + 7), gap };
}

function grainAt(x: number, y: number, plankId: number): number {
  const wave = 0.03 * Math.sin(y * Math.PI * 14 + plankId * 40);
  const streak = wrappedValueNoise(x * 6 + wave, y * 40, 256, SEED + Math.floor(plankId * 31));
  return 0.75 * streak + 0.25 * wrappedFbm(x, y, 47, 2, SEED + 5);
}

function knotAt(x: number, y: number, plankId: number): number {
  const knotSpot = wrappedValueNoise(x, y, 7, SEED + 11);
  return knotSpot > 0.9 ? (knotSpot - 0.9) * 6 * (0.5 + plankId * 0.5) : 0;
}
