import type { Rgb } from './materialSynth';
import { mixed, shaded } from './rgbShading';
import { wrappedFbm } from './wrappedNoise';

const GRIME: Rgb = [46, 40, 34];

export function grimed(base: Rgb, x: number, y: number, seed: number, strength: number): Rgb {
  const stain = wrappedFbm(x, y, 5, 3, seed);
  const speck = wrappedFbm(x, y, 41, 2, seed + 13);
  const darkened = mixed(base, GRIME, strength * Math.max(0, stain - 0.45));
  return speck > 0.78 ? shaded(darkened, 0.82) : darkened;
}

export function jointShaded(base: Rgb, jointDistance: number, reach: number): Rgb {
  const closeness = Math.max(0, 1 - jointDistance / reach);
  return shaded(base, 1 - 0.38 * closeness * closeness);
}
