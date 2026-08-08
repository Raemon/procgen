import { coursedBlockAt } from '../coursedLayout';
import { grimed, jointShaded } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { wrappedFbm } from '../wrappedNoise';

const SEED = synthSeed('flagstone', 'base');
const PALE: Rgb = [140, 134, 122];
const DUSK: Rgb = [110, 106, 98];

export const flagstone: MaterialSynth = sameOnEveryFace('flagstone', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const slab = coursedBlockAt(x, y, 3, 3, SEED);
  const mottle = wrappedFbm(x, y, 11, 3, SEED + 3);
  const tinted = mixed(PALE, DUSK, slab.blockId * 0.6 + mottle * 0.35);
  const worn = shaded(tinted, 0.95 + 0.1 * wrappedFbm(x, y, 39, 2, SEED + 5));
  return grimed(jointShaded(worn, slab.jointDistance, 0.2), x, y, SEED + 9, 0.45);
}

function heightAt(x: number, y: number): number {
  const slab = coursedBlockAt(x, y, 3, 3, SEED);
  return 0.4 + 0.5 * Math.min(1, slab.jointDistance / 0.12) + 0.1 * wrappedFbm(x, y, 21, 2, SEED + 7);
}
