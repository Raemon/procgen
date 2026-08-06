import { hashLatticePoint } from './hashLatticePoint';

export function valueNoise(x: number, y: number, seed: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const acrossTop = lerp(
    hashLatticePoint(cellX, cellY, seed),
    hashLatticePoint(cellX + 1, cellY, seed),
    smoothstep(x - cellX),
  );
  const acrossBottom = lerp(
    hashLatticePoint(cellX, cellY + 1, seed),
    hashLatticePoint(cellX + 1, cellY + 1, seed),
    smoothstep(x - cellX),
  );
  return lerp(acrossTop, acrossBottom, smoothstep(y - cellY));
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
