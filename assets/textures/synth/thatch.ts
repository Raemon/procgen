import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { cellHash01, synthSeed } from '../synthSeeds';
import { wrappedFbm, wrappedValueNoise } from '../wrappedNoise';

const SEED = synthSeed('thatch', 'base');
const STRAW: Rgb = [158, 134, 88];
const AGED: Rgb = [112, 96, 66];
const COURSES = 4;
const STRANDS = 96;

export const thatch: MaterialSynth = sameOnEveryFace('thatch', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const strand = strandAt(x, y);
  const age = wrappedFbm(x, y, 3, 2, SEED + 3);
  const courseShadow = courseLipAt(y) < 0.25 ? 0.62 + courseLipAt(y) : 1;
  const tinted = mixed(STRAW, AGED, age * 0.6 + 0.25 * strand.tone);
  return grimed(shaded(tinted, courseShadow * (0.72 + 0.55 * strand.ridge)), x, y, SEED + 9, 0.25);
}

function heightAt(x: number, y: number): number {
  const strand = strandAt(x, y);
  return (0.3 + 0.6 * strand.ridge) * (0.6 + 0.4 * Math.min(1, courseLipAt(y) * 3));
}

function strandAt(x: number, y: number): { ridge: number; tone: number } {
  const column = Math.floor(x * STRANDS);
  const columnFrac = x * STRANDS - column;
  const sway = 0.35 * wrappedValueNoise(x, 0, 13, SEED + 4);
  const ridge = 1 - Math.abs(columnFrac - 0.5 + sway) * 1.6;
  return { ridge: Math.max(0.1, ridge), tone: cellHash01(column, Math.floor(y * COURSES), SEED + 6) };
}

function courseLipAt(y: number): number {
  return (y * COURSES) % 1;
}
