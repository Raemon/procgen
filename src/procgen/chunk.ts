export const CHUNK_SIZE = 32;
export const CELLS_PER_CHUNK = CHUNK_SIZE * CHUNK_SIZE;

export function chunkCoordOfCell(cellCoord: number): number {
  return Math.floor(cellCoord / CHUNK_SIZE);
}

export function chunkOrigin(chunkCoord: number): number {
  return chunkCoord * CHUNK_SIZE;
}

export function chunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}

export function cellIndexInChunk(worldX: number, worldY: number): number {
  return wrapIntoChunk(worldY) * CHUNK_SIZE + wrapIntoChunk(worldX);
}

function wrapIntoChunk(cellCoord: number): number {
  return ((cellCoord % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
}
