import type { MaterialSynth, Rgb } from '../materialSynth';
import { brickShade, runningBondBrick, shadedInk, stoneShade, tiledStone, vnoise } from './dungeonStone';

const SHADE_CEILING = 1.281;
const CAP_DARKENING = 0.9;
const CAP_RELIEF_CEILING = 1.1;
const FACE_RELIEF_CEILING = 1.09;
const CAP_GROUT = 0.1;

export const dungeonWall: MaterialSynth = {
  id: 'dungeonWall',
  faces: ['top', 'side'],
  colorAt: (x, y, face) => (face === 'side' ? faceInk(x, y) : capInk(x, y)),
  heightAt: (x, y, face) => (face === 'side' ? faceRelief(x, y) : capRelief(x, y)),
};

function capInk(x: number, y: number): Rgb {
  return shadedInk(CAP_DARKENING * stoneShade(x, y, 1, CAP_GROUT), SHADE_CEILING);
}

function faceInk(x: number, y: number): Rgb {
  return shadedInk(brickShade(x, 1 - y), SHADE_CEILING);
}

function capRelief(x: number, y: number): number {
  return (tiledStone(x, y, 1, CAP_GROUT).relief + 0.1 * vnoise(x * 6, y * 6, 6)) / CAP_RELIEF_CEILING;
}

function faceRelief(x: number, y: number): number {
  return runningBondBrick(x, 1 - y).relief / FACE_RELIEF_CEILING;
}
