// Hand-rolled value noise: hashed lattice corners, smoothstep interpolation,
// a few octaves. No dependencies, fully determined by the seed.

import { hash2d } from './rng';

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Single-octave value noise at (x, y), in [0, 1). */
export function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);
  const a = hash2d(ix, iy, seed);
  const b = hash2d(ix + 1, iy, seed);
  const c = hash2d(ix, iy + 1, seed);
  const d = hash2d(ix + 1, iy + 1, seed);
  const top = a + (b - a) * fx;
  const bot = c + (d - c) * fx;
  return top + (bot - top) * fy;
}

/** Fractal (fBm) value noise, `octaves` layers at lacunarity 2 / gain 0.5,
 *  normalized to [0, 1]. */
export function fractalNoise(x: number, y: number, seed: number, octaves: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    // Offset the seed per octave so layers do not share a lattice.
    sum += valueNoise(x * freq, y * freq, (seed + o * 0x9e3779b9) | 0) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}
