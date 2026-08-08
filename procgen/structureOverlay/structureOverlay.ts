import type { Piece } from '../../assets/pieces/pieceDef';
import { CHUNK_SIZE, chunkCoordOfCell, chunkKey, chunkOrigin } from '../chunk';
import { ChunkVoxelColumns, type VoxelColumn } from './chunkVoxelColumns';
import { placedPieceOf } from './piecePlacement';
import { stampPlacedPieceIntoChunk } from './stampPlacedPiece';
import { piecePlacementsOf, type StructurePlacement } from './structurePlacement';

const CACHED_CHUNKS = 256;
export const MAX_STRUCTURE_SIDE = 32;

export interface PieceSource {
  byId(id: number): Piece | undefined;
  largestFootprint(): number;
}

export const NO_PIECES: PieceSource = {
  byId: () => undefined,
  largestFootprint: () => 0,
};

export type PlacementsInChunk = (chunkX: number, chunkY: number) => StructurePlacement[];

export class StructureOverlay {
  private readonly cache = new Map<string, ChunkVoxelColumns>();

  constructor(
    private readonly pieces: PieceSource,
    private readonly placementsInChunk: PlacementsInChunk,
  ) {}

  invalidate(): void {
    this.cache.clear();
  }

  packedColumnAt(worldX: number, worldY: number): VoxelColumn | null {
    const chunkX = chunkCoordOfCell(worldX);
    const chunkY = chunkCoordOfCell(worldY);
    const cellX = worldX - chunkOrigin(chunkX);
    const cellY = worldY - chunkOrigin(chunkY);
    return this.columnsForChunk(chunkX, chunkY).packedColumnAt(cellY * CHUNK_SIZE + cellX);
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
    for (const placement of piecePlacementsOf(this.placementsNear(chunkX, chunkY))) {
      const piece = this.pieces.byId(placement.pieceId);
      if (piece) {
        stampPlacedPieceIntoChunk(placedPieceOf(piece, placement), originX, originY, columns);
      }
    }
    return columns;
  }

  private placementsNear(chunkX: number, chunkY: number): StructurePlacement[] {
    const radius = this.reachInChunks();
    const placements: StructurePlacement[] = [];
    for (let y = chunkY - radius; y <= chunkY + radius; y++) {
      for (let x = chunkX - radius; x <= chunkX + radius; x++) {
        placements.push(...this.placementsInChunk(x, y));
      }
    }
    return placements;
  }

  private reachInChunks(): number {
    return Math.ceil(Math.max(this.pieces.largestFootprint(), MAX_STRUCTURE_SIDE) / CHUNK_SIZE);
  }

  private evictWhenFull(): void {
    if (this.cache.size < CACHED_CHUNKS) return;
    const oldest = this.cache.keys().next().value;
    if (oldest !== undefined) this.cache.delete(oldest);
  }
}
