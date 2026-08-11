import { coursedBlockAt } from '../coursedLayout';
import { grimed, jointShaded } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { synthSeed } from '../synthSeeds';
import { wrappedFbm } from '../wrappedNoise';

const SEED = synthSeed('dressedGranite', 'base');
const LIGHT: Rgb = [148, 142, 134];
const DARK: Rgb = [112, 106, 100];
const COURSES = 5;
const BLOCKS = 3;

export const dressedGranite: MaterialSynth = sameOnEveryFace('dressedGranite', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const block = coursedBlockAt(x, y, COURSES, BLOCKS, SEED);
  const speckle = wrappedFbm(x, y, 53, 2, SEED + 3);
  const blockTint = mixed(LIGHT, DARK, block.blockId * 0.7 + speckle * 0.3);
  const chiselled = shaded(blockTint, 0.94 + 0.12 * wrappedFbm(x, y, 17, 3, SEED + 5));
  return grimed(jointShaded(chiselled, block.jointDistance, 0.35), x, y, SEED + 9, 0.5);
}

function heightAt(x: number, y: number): number {
  const block = coursedBlockAt(x, y, COURSES, BLOCKS, SEED);
  const mortarDrop = Math.min(1, block.jointDistance / 0.22);
  return 0.35 + 0.5 * mortarDrop + 0.15 * wrappedFbm(x, y, 29, 3, SEED + 7);
}
