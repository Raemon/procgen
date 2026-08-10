import { hashLatticePoint } from '../../../procgen/noise/hashLatticePoint';
import { wrapped } from './pixelCanvas';

export interface PatchScale {
  seed: number;
  cell: number;
  size: number;
}

export function pixelNoise(x: number, y: number, seed: number): number {
  return hashLatticePoint(x, y, seed);
}

function patchNoise(x: number, y: number, scale: PatchScale): number {
  const lattice = Math.max(1, Math.round(scale.size / scale.cell));
  const [gridX, gridY] = [x / scale.cell, y / scale.cell];
  const [cornerX, cornerY] = [Math.floor(gridX), Math.floor(gridY)];
  const corner = (dx: number, dy: number): number =>
    hashLatticePoint(wrapped(cornerX + dx, lattice), wrapped(cornerY + dy, lattice), scale.seed);
  const [alongX, alongY] = [easeCurve(gridX - cornerX), easeCurve(gridY - cornerY)];
  return mixValues(
    mixValues(corner(0, 0), corner(1, 0), alongX),
    mixValues(corner(0, 1), corner(1, 1), alongX),
    alongY,
  );
}

export function twoOctavePatchNoise(x: number, y: number, scale: PatchScale): number {
  const fine = { seed: scale.seed ^ 0x5bf03635, cell: Math.max(1, scale.cell / 2), size: scale.size };
  return patchNoise(x, y, scale) * 0.65 + patchNoise(x, y, fine) * 0.35;
}

export function pickByValue<T>(choices: readonly T[], value: number): T {
  const picked = choices[Math.min(choices.length - 1, Math.floor(value * choices.length))];
  if (picked === undefined) throw new Error('pickByValue needs a non-empty palette');
  return picked;
}

function mixValues(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function easeCurve(amount: number): number {
  return amount * amount * (3 - 2 * amount);
}
