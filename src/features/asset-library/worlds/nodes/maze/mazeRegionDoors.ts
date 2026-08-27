import type { ChunkGenCtx } from '../../nodeType';

export interface RegionBorderDoors {
  west: number[];
  north: number[];
  east: number[];
  south: number[];
}

export type SeamSide = 'west' | 'north';

export type CellGate = (regionX: number, regionY: number, cellX: number, cellY: number) => boolean;

export function regionBorderDoors(
  ctx: ChunkGenCtx,
  regionX: number,
  regionY: number,
  cells: number,
  doorsPerEdge: number,
  gate: CellGate | null,
): RegionBorderDoors {
  const doorsAt = (gridX: number, gridY: number, side: SeamSide) =>
    pickDoorCells(cells, doorsPerEdge, ctx, gridX, gridY, `${side} doors`, seamGate(gate, cells, gridX, gridY, side));
  return {
    west: doorsAt(regionX, regionY, 'west'),
    north: doorsAt(regionX, regionY, 'north'),
    east: doorsAt(regionX + 1, regionY, 'west'),
    south: doorsAt(regionX, regionY + 1, 'north'),
  };
}

function seamGate(
  gate: CellGate | null,
  cells: number,
  gridX: number,
  gridY: number,
  side: SeamSide,
): (index: number) => boolean {
  if (!gate) return () => true;
  if (side === 'west') {
    return (index) => gate(gridX - 1, gridY, cells - 1, index) && gate(gridX, gridY, 0, index);
  }
  return (index) => gate(gridX, gridY - 1, index, cells - 1) && gate(gridX, gridY, index, 0);
}

function pickDoorCells(
  cells: number,
  count: number,
  ctx: ChunkGenCtx,
  gridX: number,
  gridY: number,
  label: string,
  allowed: (index: number) => boolean,
): number[] {
  const rng = ctx.rngAt(gridX, gridY, label);
  const order = Array.from({ length: cells }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order.filter(allowed).slice(0, Math.min(count, cells));
}
