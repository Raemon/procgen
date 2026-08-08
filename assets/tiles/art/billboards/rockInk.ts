import { twoOctavePatchNoise } from '../artNoise';
import type { PixelPainter } from '../pixelCanvas';
import type { BillboardPalette } from './billboardPalette';
import { rampInk, towardsKeyLight } from './billboardShading';

const ROCK_AMBIENT = 0.13;
const CAP_AT_LEFT = 0.46;
const CAP_TILT = 0.16;
const CAP_ROUGHNESS = 0.04;
const CAP_LIFT = 0.22;
const CAP_SALT = 0x3d90b7c1;
const GRIT_SALT = 0x51ab3c7d;
const LICHEN_CELL = 3;
const LICHEN_ABOVE = 0.72;
const LICHEN_NEEDS_LIGHT = 0.62;
const GRIT_CELL = 2;
const GRIT_WEIGHT = 0.2;

export function rockInk(palette: BillboardPalette, size: number, seed: number): PixelPainter {
  return (x, y) => {
    const light = rockLightAt(x, y, size, seed);
    if (light > LICHEN_NEEDS_LIGHT && isLichen(x, y, size, seed)) return palette.moss;
    return rampInk(palette, light);
  };
}

function rockLightAt(x: number, y: number, size: number, seed: number): number {
  const cap = isCapFacet(x, y, size, seed) ? CAP_LIFT : 0;
  return towardsKeyLight(x, y, size) + ROCK_AMBIENT + cap + gritAt(x, y, size, seed);
}

function gritAt(x: number, y: number, size: number, seed: number): number {
  const grit = twoOctavePatchNoise(x, y, { seed: seed ^ GRIT_SALT, cell: GRIT_CELL, size });
  return (grit - 0.5) * GRIT_WEIGHT;
}

function isCapFacet(x: number, y: number, size: number, seed: number): boolean {
  const roughness = twoOctavePatchNoise(x, 0, { seed: seed ^ CAP_SALT, cell: LICHEN_CELL, size }) - 0.5;
  return y / size < CAP_AT_LEFT + CAP_TILT * (x / size) + CAP_ROUGHNESS * roughness;
}

function isLichen(x: number, y: number, size: number, seed: number): boolean {
  return twoOctavePatchNoise(x, y, { seed, cell: LICHEN_CELL, size }) > LICHEN_ABOVE;
}
