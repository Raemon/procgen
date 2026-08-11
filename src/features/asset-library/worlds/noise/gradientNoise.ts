import { hashLatticePoint } from './hashLatticePoint';

const TAU = Math.PI * 2;
const PEAK_AMPLITUDE = Math.SQRT1_2;

export function gradientNoise(x: number, y: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const fx = x - cellX;
  const fy = y - cellY;
  const top = lerp(corner(cellX, cellY, seed, fx, fy), corner(cellX + 1, cellY, seed, fx - 1, fy), fade(fx));
  const bottom = lerp(
    corner(cellX, cellY + 1, seed, fx, fy - 1),
    corner(cellX + 1, cellY + 1, seed, fx - 1, fy - 1),
    fade(fx),
  );
  return unitRange(lerp(top, bottom, fade(fy)));
}

function corner(latticeX: number, latticeY: number, seed: number, dx: number, dy: number): number {
  const angle = hashLatticePoint(latticeX, latticeY, seed) * TAU;
  return Math.cos(angle) * dx + Math.sin(angle) * dy;
}

function unitRange(signedNoise: number): number {
  return Math.max(0, Math.min(1, signedNoise / (2 * PEAK_AMPLITUDE) + 0.5));
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
