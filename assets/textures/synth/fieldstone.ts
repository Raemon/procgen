import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { nearestFieldStone } from '../stoneField';
import { wrappedFbm } from '../wrappedNoise';

const SEED = synthSeed('fieldstone', 'base');
const STONE: Rgb = [132, 124, 110];
const COOL: Rgb = [108, 106, 100];
const MORTAR: Rgb = [72, 66, 58];
const CELLS = 5;

export const fieldstone: MaterialSynth = sameOnEveryFace('fieldstone', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const stone = nearestFieldStone(x, y, CELLS, SEED);
  if (stone.rim > 0.88) return shaded(MORTAR, 0.85 + 0.3 * wrappedFbm(x, y, 31, 2, SEED + 5));
  const tinted = mixed(STONE, COOL, stone.id * 0.8);
  const faceLight = 1.12 - 0.5 * stone.rim + 0.12 * wrappedFbm(x, y, 21, 3, SEED + 3);
  return grimed(shaded(tinted, faceLight), x, y, SEED + 9, 0.45);
}

function heightAt(x: number, y: number): number {
  const stone = nearestFieldStone(x, y, CELLS, SEED);
  if (stone.rim > 0.88) return 0.15;
  return 0.3 + 0.7 * (1 - stone.rim) + 0.06 * wrappedFbm(x, y, 37, 2, SEED + 7);
}
