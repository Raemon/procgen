import type { ChunkGenCtx } from '../../nodeType';
import type { WorldPoint } from '../../values/chunkValues';

export function scriptSafeCtx(ctx: ChunkGenCtx): ChunkGenCtx {
  return {
    ...ctx,
    pointsInput: (name) => copiedPoints(ctx.pointsInput(name)),
    inputAt: (name, chunkX, chunkY) => ctx.inputAt(name, chunkX, chunkY),
  };
}

function copiedPoints(points: readonly WorldPoint[] | null): WorldPoint[] | null {
  if (!points) return null;
  return points.map((point) => ({ ...point, data: point.data ? { ...point.data } : undefined }));
}
