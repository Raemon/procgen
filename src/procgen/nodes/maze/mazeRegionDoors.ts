import type { ChunkGenCtx } from '../../nodeType';

export interface RegionBorderDoors {
  west: number[];
  north: number[];
  east: number[];
  south: number[];
}

export function regionBorderDoors(
  ctx: ChunkGenCtx,
  regionX: number,
  regionY: number,
  cells: number,
  doorsPerEdge: number,
): RegionBorderDoors {
  const doorsAt = (gridX: number, gridY: number, label: string) =>
    pickDoorCells(cells, doorsPerEdge, ctx, gridX, gridY, label);
  return {
    west: doorsAt(regionX, regionY, 'west doors'),
    north: doorsAt(regionX, regionY, 'north doors'),
    east: doorsAt(regionX + 1, regionY, 'west doors'),
    south: doorsAt(regionX, regionY + 1, 'north doors'),
  };
}

function pickDoorCells(
  cells: number,
  count: number,
  ctx: ChunkGenCtx,
  gridX: number,
  gridY: number,
  label: string,
): number[] {
  const rng = ctx.rngAt(gridX, gridY, label);
  const order = Array.from({ length: cells }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order.slice(0, Math.min(count, cells));
}
