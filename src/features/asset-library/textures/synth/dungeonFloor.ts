import { sameOnEveryFace, type MaterialSynth } from '../materialSynth';
import { shadedInk, stoneShade, tiledStone, vnoise } from './dungeonStone';

const SHADE_CEILING = 1.2544;
const RELIEF_CEILING = 1.12;
const GROUT = 0.07;

export const dungeonFloor: MaterialSynth = sameOnEveryFace(
  'dungeonFloor',
  (x, y) => shadedInk(stoneShade(x, y, 1, GROUT), SHADE_CEILING),
  (x, y) => (tiledStone(x, y, 1, GROUT).relief + 0.12 * vnoise(x * 9, y * 9, 9)) / RELIEF_CEILING,
);
