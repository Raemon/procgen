import type { ChunkGenCtx } from '../../nodeType';
import type { WorldPoint } from '../../values/chunkValues';
import { asPoints } from '../../values/valueAccess';

export function nearbyVillageCenters(
  ctx: ChunkGenCtx,
  inputName: string,
  radius: number,
): WorldPoint[] {
  const reach = Math.ceil(radius / ctx.size);
  const centers: WorldPoint[] = [];
  for (let chunkY = ctx.chunkY - reach; chunkY <= ctx.chunkY + reach; chunkY++) {
    for (let chunkX = ctx.chunkX - reach; chunkX <= ctx.chunkX + reach; chunkX++) {
      centers.push(...(asPoints(ctx.inputAt(inputName, chunkX, chunkY)) ?? []));
    }
  }
  return centers;
}
