import type { GenPass } from '../genPass';
import { caSmooth } from './caSmooth';
import { elevationNoise } from './elevationNoise';
import { scatterTrees } from './scatterTrees';
import { thresholdTerrain } from './thresholdTerrain';

export const PASSES: readonly GenPass[] = [
  elevationNoise,
  thresholdTerrain,
  caSmooth,
  scatterTrees,
];

export const PASS_NAMES = PASSES.map((pass) => pass.name);
