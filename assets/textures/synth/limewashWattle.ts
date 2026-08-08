import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { wrappedFbm, wrappedValueNoise } from '../wrappedNoise';

const SEED = synthSeed('limewashWattle', 'base');
const LIMEWASH: Rgb = [214, 206, 190];
const DAUB: Rgb = [172, 158, 134];
const STAIN: Rgb = [148, 138, 118];

export const limewashWattle: MaterialSynth = sameOnEveryFace('limewashWattle', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const undulation = wrappedFbm(x, y, 7, 3, SEED);
  const wornPatch = Math.max(0, wrappedFbm(x, y, 4, 2, SEED + 3) - 0.58) * 2.4;
  const streaks = Math.max(0, wrappedValueNoise(x * 4, y, 48, SEED + 5) - 0.6) * y;
  const surface = mixed(mixed(LIMEWASH, DAUB, wornPatch), STAIN, streaks);
  return grimed(shaded(surface, 0.92 + 0.16 * undulation), x, y, SEED + 9, 0.28);
}

function heightAt(x: number, y: number): number {
  const undulation = wrappedFbm(x, y, 7, 3, SEED);
  const crack = wrappedValueNoise(x, y, 33, SEED + 7) > 0.87 ? 0.25 : 0;
  return 0.45 + 0.4 * undulation - crack;
}
