import { cellHash01 } from './synthSeeds';

export function wrappedValueNoise(x: number, y: number, period: number, seed: number): number {
  const cellX = Math.floor(x * period);
  const cellY = Math.floor(y * period);
  const fracX = smooth(x * period - cellX);
  const fracY = smooth(y * period - cellY);
  const corner = (dx: number, dy: number) =>
    cellHash01(wrap(cellX + dx, period), wrap(cellY + dy, period), seed);
  const top = lerp(corner(0, 0), corner(1, 0), fracX);
  const bottom = lerp(corner(0, 1), corner(1, 1), fracX);
  return lerp(top, bottom, fracY);
}

export function wrappedFbm(x: number, y: number, basePeriod: number, octaves: number, seed: number): number {
  let sum = 0;
  let amplitude = 0.5;
  let total = 0;
  for (let octave = 0; octave < octaves; octave++) {
    sum += amplitude * wrappedValueNoise(x, y, basePeriod << octave, seed + octave * 101);
    total += amplitude;
    amplitude /= 2;
  }
  return sum / total;
}

function wrap(cell: number, period: number): number {
  return ((cell % period) + period) % period;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
