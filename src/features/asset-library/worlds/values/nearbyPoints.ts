import type { ChunkGenCtx } from '../nodeType';
import type { WorldPoint } from './chunkValues';
import { asPoints } from './valueAccess';

export function nearbyPoints(
  ctx: ChunkGenCtx,
  inputName: string,
  radiusTiles: number,
): WorldPoint[] {
  const reach = Math.ceil(radiusTiles / ctx.size);
  const gathered: WorldPoint[] = [];
  for (let chunkY = ctx.chunkY - reach; chunkY <= ctx.chunkY + reach; chunkY++) {
    for (let chunkX = ctx.chunkX - reach; chunkX <= ctx.chunkX + reach; chunkX++) {
      gathered.push(...(asPoints(ctx.inputAt(inputName, chunkX, chunkY)) ?? []));
    }
  }
  return gathered;
}
