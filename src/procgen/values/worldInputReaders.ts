import type { ChunkGenCtx } from '../nodeType';
import { EMPTY_TILE } from './chunkValues';
import { asField, asTiles } from './valueAccess';

export type WorldFieldReader = (worldX: number, worldY: number) => number | null;
export type WorldTileReader = (worldX: number, worldY: number) => number;

export function worldFieldReader(ctx: ChunkGenCtx, inputName: string): WorldFieldReader {
  return (worldX, worldY) => {
    const chunkX = Math.floor(worldX / ctx.size);
    const chunkY = Math.floor(worldY / ctx.size);
    const field = asField(ctx.inputAt(inputName, chunkX, chunkY));
    return field ? field[cellIndexInChunk(ctx, worldX, worldY, chunkX, chunkY)]! : null;
  };
}

export function worldTileReader(ctx: ChunkGenCtx, inputName: string): WorldTileReader {
  return (worldX, worldY) => {
    const chunkX = Math.floor(worldX / ctx.size);
    const chunkY = Math.floor(worldY / ctx.size);
    const tiles = asTiles(ctx.inputAt(inputName, chunkX, chunkY));
    return tiles ? tiles[cellIndexInChunk(ctx, worldX, worldY, chunkX, chunkY)]! : EMPTY_TILE;
  };
}

function cellIndexInChunk(
  ctx: ChunkGenCtx,
  worldX: number,
  worldY: number,
  chunkX: number,
  chunkY: number,
): number {
  return (worldY - chunkY * ctx.size) * ctx.size + (worldX - chunkX * ctx.size);
}
