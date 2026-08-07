import type { Prefab } from '../../prefabs/prefabDef';
import { CHUNK_SIZE, chunkCoordOfCell, chunkKey, chunkOrigin } from '../chunk';
import { ChunkVoxelColumns, type VoxelColumn } from './chunkVoxelColumns';
import { placedPrefabOf, type PrefabPlacement } from './prefabPlacement';
import { stampPlacedPrefabIntoChunk } from './stampPlacedPrefab';

const CACHED_CHUNKS = 256;

export interface PrefabSource {
  byId(id: number): Prefab | undefined;
  largestFootprint(): number;
}

export const NO_PREFABS: PrefabSource = {
  byId: () => undefined,
  largestFootprint: () => 0,
};

export type PlacementsInChunk = (chunkX: number, chunkY: number) => PrefabPlacement[];

export class PrefabOverlay {
  private readonly cache = new Map<string, ChunkVoxelColumns>();

  constructor(
    private readonly prefabs: PrefabSource,
    private readonly placementsInChunk: PlacementsInChunk,
  ) {}

  invalidate(): void {
    this.cache.clear();
  }

  columnAt(worldX: number, worldY: number): VoxelColumn | null {
    const chunkX = chunkCoordOfCell(worldX);
    const chunkY = chunkCoordOfCell(worldY);
    const cellX = worldX - chunkOrigin(chunkX);
    const cellY = worldY - chunkOrigin(chunkY);
    return this.columnsForChunk(chunkX, chunkY).columnAt(cellY * CHUNK_SIZE + cellX);
  }

  columnsForChunk(chunkX: number, chunkY: number): ChunkVoxelColumns {
    const key = chunkKey(chunkX, chunkY);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const columns = this.buildColumnsForChunk(chunkX, chunkY);
    this.evictWhenFull();
    this.cache.set(key, columns);
    return columns;
  }

  private buildColumnsForChunk(chunkX: number, chunkY: number): ChunkVoxelColumns {
    const columns = new ChunkVoxelColumns();
    const originX = chunkOrigin(chunkX);
    const originY = chunkOrigin(chunkY);
    for (const placement of this.placementsNear(chunkX, chunkY)) {
      const prefab = this.prefabs.byId(placement.prefabId);
      if (prefab) {
        stampPlacedPrefabIntoChunk(placedPrefabOf(prefab, placement), originX, originY, columns);
      }
    }
    return columns;
  }

  private placementsNear(chunkX: number, chunkY: number): PrefabPlacement[] {
    const radius = this.reachInChunks();
    const placements: PrefabPlacement[] = [];
    for (let y = chunkY - radius; y <= chunkY + radius; y++) {
      for (let x = chunkX - radius; x <= chunkX + radius; x++) {
        placements.push(...this.placementsInChunk(x, y));
      }
    }
    return placements;
  }

  private reachInChunks(): number {
    return Math.ceil(this.prefabs.largestFootprint() / CHUNK_SIZE);
  }

  private evictWhenFull(): void {
    if (this.cache.size < CACHED_CHUNKS) return;
    const oldest = this.cache.keys().next().value;
    if (oldest !== undefined) this.cache.delete(oldest);
  }
}
