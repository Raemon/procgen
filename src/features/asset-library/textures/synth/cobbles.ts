import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { nearestFieldStone } from '../stoneField';
import { wrappedFbm } from '../wrappedNoise';

const SEED = synthSeed('cobbles', 'base');
const WORN: Rgb = [128, 120, 108];
const BLUE_GRAY: Rgb = [100, 102, 108];
const EARTH: Rgb = [74, 64, 52];
const CELLS = 6;

export const cobbles: MaterialSynth = sameOnEveryFace('cobbles', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const stone = nearestFieldStone(x, y, CELLS, SEED);
  if (stone.rim > 0.8) return shaded(EARTH, 0.85 + 0.3 * wrappedFbm(x, y, 27, 2, SEED + 5));
  const tinted = mixed(WORN, BLUE_GRAY, stone.id);
  const dome = 1 - stone.rim;
  const polished = shaded(tinted, 0.7 + 0.6 * dome + 0.1 * wrappedFbm(x, y, 33, 2, SEED + 3));
  return grimed(polished, x, y, SEED + 9, 0.4);
}

function heightAt(x: number, y: number): number {
  const stone = nearestFieldStone(x, y, CELLS, SEED);
  return stone.rim > 0.8 ? 0.15 : 0.25 + 0.75 * (1 - stone.rim);
}
