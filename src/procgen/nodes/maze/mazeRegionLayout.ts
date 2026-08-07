export interface MazeRegionLayout {
  regionChunks: number;
  regionSize: number;
  pitch: number;
  corridor: number;
  wall: number;
  cells: number;
}

export function mazeRegionLayout(
  chunkSize: number,
  corridor: number,
  wall: number,
  regionChunks: number,
): MazeRegionLayout {
  const regionSize = regionChunks * chunkSize;
  const pitch = Math.min(corridor + wall, regionSize);
  return {
    regionChunks,
    regionSize,
    pitch,
    corridor: pitch - wall,
    wall,
    cells: Math.max(1, Math.floor(regionSize / pitch)),
  };
}

export function regionIndexOfChunk(chunkCoord: number, regionChunks: number): number {
  return Math.floor(chunkCoord / regionChunks);
}

export function chunkOffsetInRegion(
  chunkCoord: number,
  regionIndex: number,
  regionChunks: number,
  chunkSize: number,
): number {
  return (chunkCoord - regionIndex * regionChunks) * chunkSize;
}
