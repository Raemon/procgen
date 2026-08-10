import type { ChunkGenCtx } from '../../nodeType';
import type { WorldPoint } from '../../values/chunkValues';
import { BORN, CHAIN_ID, CONE_HEIGHT, CONE_RADIUS, pointNumber } from '../../values/pointData';
import { asPoints } from '../../values/valueAccess';
import type { VolcanoCone } from '../../volcanic/hotspotChains';

export function nearbyVolcanoes(
  ctx: ChunkGenCtx,
  inputName: string,
  radiusTiles: number,
): WorldPoint[] {
  const reach = Math.ceil(radiusTiles / (ctx.size * ctx.stride));
  const volcanoes: WorldPoint[] = [];
  for (let chunkY = ctx.chunkY - reach; chunkY <= ctx.chunkY + reach; chunkY++) {
    for (let chunkX = ctx.chunkX - reach; chunkX <= ctx.chunkX + reach; chunkX++) {
      volcanoes.push(...(asPoints(ctx.inputAt(inputName, chunkX, chunkY)) ?? []));
    }
  }
  return volcanoes;
}

export function coneOfPoint(point: WorldPoint): VolcanoCone {
  return {
    x: point.x,
    y: point.y,
    born: pointNumber(point, BORN, 0),
    chainId: pointNumber(point, CHAIN_ID, 0),
    radius: pointNumber(point, CONE_RADIUS, 32),
    height: pointNumber(point, CONE_HEIGHT, 0.5),
  };
}
