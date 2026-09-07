import type { MaterialSynth, Rgb } from '../materialSynth';
import {
  brickShade,
  edgeDistance,
  runningBondBrick,
  shadedInk,
  smoothstep,
  stoneShade,
  tiledStone,
} from './dungeonStone';

const SHADE_CEILING = 1.281;
const DECK_RELIEF_CEILING = 1.5;
const FLANK_RELIEF_CEILING = 1.09;
const DECK_TILE = 0.5;
const DECK_GROUT = 0.05;
const LIP_REACH = 0.14;

export const dungeonLedge: MaterialSynth = {
  id: 'dungeonLedge',
  faces: ['top', 'side'],
  colorAt: (x, y, face) => (face === 'side' ? flankInk(x, y) : deckInk(x, y)),
  heightAt: (x, y, face) => (face === 'side' ? flankRelief(x, y) : deckRelief(x, y)),
};

function deckInk(x: number, y: number): Rgb {
  return shadedInk(stoneShade(x, y, DECK_TILE, DECK_GROUT), SHADE_CEILING);
}

function flankInk(x: number, y: number): Rgb {
  return shadedInk(brickShade(x, 1 - y), SHADE_CEILING);
}

function deckRelief(x: number, y: number): number {
  const lip = 0.5 * smoothstep(0, LIP_REACH, edgeDistance(x, y));
  return (tiledStone(x, y, DECK_TILE, DECK_GROUT).relief + lip) / DECK_RELIEF_CEILING;
}

function flankRelief(x: number, y: number): number {
  return runningBondBrick(x, 1 - y).relief / FLANK_RELIEF_CEILING;
}
