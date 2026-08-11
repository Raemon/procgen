import type { ChunkGenCtx } from '../nodeType';
import { asField } from './valueAccess';

export type WorldFieldReader = (worldX: number, worldY: number) => number | null;

export function worldFieldReader(ctx: ChunkGenCtx, inputName: string): WorldFieldReader {
  return (worldX, worldY) => {
    const chunkX = Math.floor(worldX / ctx.size);
    const chunkY = Math.floor(worldY / ctx.size);
    const field = asField(ctx.inputAt(inputName, chunkX, chunkY));
    return field ? field[cellIndexInChunk(ctx, worldX, worldY, chunkX, chunkY)]! : null;
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
