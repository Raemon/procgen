import { grimed } from '../grimePass';
import { sameOnEveryFace, type MaterialSynth, type Rgb } from '../materialSynth';
import { mixed, shaded } from '../rgbShading';
import { cellHash01, synthSeed } from '../synthSeeds';
import { wrappedFbm } from '../wrappedNoise';

const SEED = synthSeed('slateShingle', 'base');
const SLATE: Rgb = [70, 76, 86];
const WEATHERED: Rgb = [102, 106, 108];
const COURSES = 5;
const SHINGLES = 3;

export const slateShingle: MaterialSynth = sameOnEveryFace('slateShingle', colorAt, heightAt);

function colorAt(x: number, y: number): Rgb {
  const shingle = shingleAt(x, y);
  const sheen = wrappedFbm(x, y, 19, 3, SEED + 3);
  const tinted = mixed(SLATE, WEATHERED, shingle.id * 0.55 + sheen * 0.3);
  const lit = shaded(tinted, lipLight(shingle));
  return grimed(lit, x, y, SEED + 9, 0.3);
}

function lipLight(shingle: { lip: number; sideGap: number }): number {
  if (shingle.lip < 0.16) return 0.5 + 1.6 * shingle.lip;
  if (shingle.sideGap < 0.05) return 0.72;
  return 0.98 + 0.14 * (1 - shingle.lip);
}

function heightAt(x: number, y: number): number {
  const shingle = shingleAt(x, y);
  const overhang = 1 - shingle.lip * 0.5;
  return shingle.sideGap < 0.05 ? overhang - 0.2 : overhang;
}

function shingleAt(x: number, y: number): { id: number; lip: number; sideGap: number } {
  const row = Math.floor(y * COURSES);
  const stagger = ((row % 2) * 0.5) / SHINGLES;
  const column = Math.floor((x + stagger) * SHINGLES);
  const lip = y * COURSES - row;
  const sideFrac = (x + stagger) * SHINGLES - column;
  return {
    id: cellHash01(((column % SHINGLES) + SHINGLES) % SHINGLES, row, SEED),
    lip,
    sideGap: Math.min(sideFrac, 1 - sideFrac),
  };
}
