import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { cellHash01, synthSeed } from '../synthSeeds';
import { wrappedFbm, wrappedValueNoise } from '../wrappedNoise';

export const troddenEarth = earthy('troddenEarth', [112, 94, 72], [86, 72, 56], 0.5);
export const rammedEarth = earthy('rammedEarth', [132, 112, 86], [108, 92, 72], 0.25);
export const forestLoam = earthy('forestLoam', [88, 74, 58], [64, 54, 44], 0.7);

export const grassTurf = turfy('grassTurf', [96, 116, 68], [72, 92, 54]);
export const meadowTurf = turfy('meadowTurf', [108, 122, 70], [84, 100, 58]);

function earthy(id: string, lightTone: Rgb, darkTone: Rgb, pebbles: number): MaterialSynth {
  const seed = synthSeed(id, 'base');
  return sameOnEveryFace(
    id,
    (x, y) => earthColor(x, y, seed, lightTone, darkTone, pebbles),
    (x, y) => 0.4 + 0.35 * wrappedFbm(x, y, 13, 3, seed) + pebbleAt(x, y, seed) * 0.25,
  );
}

function earthColor(x: number, y: number, seed: number, lightTone: Rgb, darkTone: Rgb, pebbles: number): Rgb {
  const patch = wrappedFbm(x, y, 9, 3, seed);
  const base = mixed(lightTone, darkTone, patch);
  const withPebble = pebbleAt(x, y, seed) > 0 ? shaded(base, 1.25) : base;
  return grimed(withPebble, x, y, seed + 9, 0.3 * pebbles);
}

function pebbleAt(x: number, y: number, seed: number): number {
  return wrappedValueNoise(x, y, 61, seed + 4) > 0.85 ? 1 : 0;
}

function turfy(id: string, lightTone: Rgb, darkTone: Rgb): MaterialSynth {
  const seed = synthSeed(id, 'base');
  return sameOnEveryFace(
    id,
    (x, y) => turfColor(x, y, seed, lightTone, darkTone),
    (x, y) => 0.45 + 0.3 * wrappedFbm(x, y, 23, 3, seed) + 0.25 * bladeAt(x, y, seed),
  );
}

function turfColor(x: number, y: number, seed: number, lightTone: Rgb, darkTone: Rgb): Rgb {
  const patch = wrappedFbm(x, y, 5, 3, seed);
  const clump = bladeAt(x, y, seed);
  const base = mixed(lightTone, darkTone, patch * 0.7 + 0.3 * cellHash01(Math.floor(x * 64), Math.floor(y * 64), seed));
  return clump > 0 ? shaded(base, 1.12) : base;
}

function bladeAt(x: number, y: number, seed: number): number {
  return wrappedValueNoise(x * 2, y, 47, seed + 6) > 0.78 ? 1 : 0;
}
