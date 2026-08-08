import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { wrappedFbm, wrappedValueNoise } from '../wrappedNoise';

const SEED = synthSeed('oakBeam', 'base');
const DARK_OAK: Rgb = [82, 62, 44];
const BLACKENED: Rgb = [52, 42, 34];

export const oakBeam: MaterialSynth = sameOnEveryFace('oakBeam', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const grain = wrappedValueNoise(x, y * 7, 72, SEED);
  const check = crackAt(x, y);
  const tinted = mixed(DARK_OAK, BLACKENED, 0.3 * grain + 0.5 * check);
  const edgeDark = Math.min(y, 1 - y) < 0.08 ? 0.78 : 1;
  return grimed(shaded(tinted, edgeDark), x, y, SEED + 9, 0.45);
}

function heightAt(x: number, y: number): number {
  return 0.55 - 0.35 * crackAt(x, y) + 0.12 * wrappedFbm(x, y, 25, 2, SEED + 5);
}

function crackAt(x: number, y: number): number {
  const streak = wrappedValueNoise(x, y * 9, 88, SEED + 3);
  return streak > 0.72 ? (streak - 0.72) / 0.28 : 0;
}
