import { cellHash01 } from './synthSeeds';

export interface FieldStone {
  id: number;
  rim: number;
}

export function nearestFieldStone(x: number, y: number, cells: number, seed: number): FieldStone {
  let best: FieldStone = { id: 0, rim: 2 };
  for (const [dx, dy] of NEIGHBOR_CELLS) {
    const candidate = stoneInCell(x, y, cells, seed, dx, dy);
    if (candidate.rim < best.rim) best = candidate;
  }
  return best;
}

function stoneInCell(
  x: number,
  y: number,
  cells: number,
  seed: number,
  dx: number,
  dy: number,
): FieldStone {
  const cellX = Math.floor(x * cells) + dx;
  const cellY = Math.floor(y * cells) + dy;
  const wrapX = ((cellX % cells) + cells) % cells;
  const wrapY = ((cellY % cells) + cells) % cells;
  const centerX = (cellX + 0.25 + 0.5 * cellHash01(wrapX, wrapY, seed)) / cells;
  const centerY = (cellY + 0.25 + 0.5 * cellHash01(wrapX, wrapY, seed + 1)) / cells;
  const rim = Math.hypot(x - centerX, y - centerY) * cells * 1.6;
  return { id: cellHash01(wrapX, wrapY, seed + 2), rim };
}

const NEIGHBOR_CELLS = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => [dx, dy] as const));
