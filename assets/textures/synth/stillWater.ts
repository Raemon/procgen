import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { wrappedFbm, wrappedValueNoise } from '../wrappedNoise';

const SEED = synthSeed('stillWater', 'base');
const DEEP: Rgb = [40, 66, 88];
const SHOAL: Rgb = [66, 100, 116];
const GLINT: Rgb = [148, 172, 180];

export const stillWater: MaterialSynth = sameOnEveryFace('stillWater', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const swell = wrappedFbm(x, y, 4, 3, SEED);
  const ripple = rippleAt(x, y);
  const body = mixed(DEEP, SHOAL, swell * 0.8);
  return ripple > 0.82 ? mixed(body, GLINT, (ripple - 0.82) * 3) : shaded(body, 0.96 + 0.08 * ripple);
}

function heightAt(x: number, y: number): number {
  return 0.5 + 0.12 * rippleAt(x, y);
}

function rippleAt(x: number, y: number): number {
  return wrappedValueNoise(x * 3, y, 36, SEED + 3) * 0.6 + 0.4 * wrappedFbm(x, y, 15, 2, SEED + 5);
}
