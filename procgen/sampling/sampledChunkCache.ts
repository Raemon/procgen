import type { ChunkVoxelColumns } from '../structureOverlay/chunkVoxelColumns';
import type { CeilingChunk } from './mergedCeiling';

export interface SampledChunk {
  tiles: Int32Array;
  groundFacing: Uint8Array;
  elevation: Float32Array;
  columns: ChunkVoxelColumns;
  ceiling: CeilingChunk;
}

const PACK_STRIDE = 1 << 16;

export function packedChunkCoord(chunkX: number, chunkY: number): number {
  return chunkX * PACK_STRIDE + chunkY;
}

export class SampledChunkCache {
  private readonly entries = new Map<number, SampledChunk>();

  constructor(private readonly capacity: number) {}

  clear(): void {
    this.entries.clear();
  }

  at(chunkX: number, chunkY: number, build: () => SampledChunk): SampledChunk {
    const key = packedChunkCoord(chunkX, chunkY);
    const cached = this.entries.get(key);
    if (cached) return cached;
    const built = build();
    this.evictOldestWhenFull();
    this.entries.set(key, built);
    return built;
  }

  private evictOldestWhenFull(): void {
    if (this.entries.size < this.capacity) return;
    const oldest = this.entries.keys().next().value;
    if (oldest !== undefined) this.entries.delete(oldest);
  }
}
