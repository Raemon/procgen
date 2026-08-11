import type { ChunkGenCtx } from '../../nodeType';
import type { WorldPoint } from '../../values/chunkValues';
import { asPoints } from '../../values/valueAccess';

export function nearbyPointsOf(
  ctx: ChunkGenCtx,
  inputName: string,
  radiusTiles: number,
): WorldPoint[] {
  const reach = Math.ceil(radiusTiles / ctx.size);
  const points: WorldPoint[] = [];
  for (let chunkY = ctx.chunkY - reach; chunkY <= ctx.chunkY + reach; chunkY++) {
    for (let chunkX = ctx.chunkX - reach; chunkX <= ctx.chunkX + reach; chunkX++) {
      points.push(...(asPoints(ctx.inputAt(inputName, chunkX, chunkY)) ?? []));
    }
  }
  return points;
}
