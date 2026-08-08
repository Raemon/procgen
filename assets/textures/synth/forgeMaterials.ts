import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { cellHash01, synthSeed } from '../synthSeeds';
import { wrappedFbm } from '../wrappedNoise';

export const rivetedIron = ironPlate('rivetedIron');
export const forgeCoals = coalBed('forgeCoals');

function ironPlate(id: string): MaterialSynth {
  const seed = synthSeed(id, 'base');
  return sameOnEveryFace(
    id,
    (x, y) => ironColor(x, y, seed),
    (x, y) => 0.5 + 0.2 * wrappedFbm(x, y, 19, 2, seed) + (rivetAt(x, y) > 0 ? 0.3 : 0),
  );
}

function ironColor(x: number, y: number, seed: number): Rgb {
  const scuff = wrappedFbm(x, y, 13, 3, seed);
  const base = mixed([58, 58, 62], [84, 80, 78], scuff);
  const rivet = rivetAt(x, y);
  return grimed(rivet > 0 ? shaded(base, 1.3) : base, x, y, seed + 9, 0.5);
}

function rivetAt(x: number, y: number): number {
  const grid = 6;
  const centerX = (Math.floor(x * grid) + 0.5) / grid;
  const centerY = (Math.floor(y * grid) + 0.5) / grid;
  const onEdge = Math.min(centerX % 1, centerY % 1) < 0.999;
  return onEdge && Math.hypot(x - centerX, y - centerY) * grid < 0.12 ? 1 : 0;
}

function coalBed(id: string): MaterialSynth {
  const seed = synthSeed(id, 'base');
  const lump = (x: number, y: number) => cellHash01(Math.floor(x * 16), Math.floor(y * 16), seed);
  return sameOnEveryFace(
    id,
    (x, y) => coalColor(lump(x, y), wrappedFbm(x, y, 7, 2, seed + 3)),
    (x, y) => 0.3 + 0.6 * lump(x, y),
  );
}

function coalColor(lump: number, glowPatch: number): Rgb {
  const ember: Rgb = [214, 96, 32];
  const coal: Rgb = [38, 32, 30];
  return glowPatch > 0.55 && lump > 0.6 ? mixed(coal, ember, (lump - 0.6) * 2.2) : shaded(coal, 0.8 + lump * 0.5);
}
