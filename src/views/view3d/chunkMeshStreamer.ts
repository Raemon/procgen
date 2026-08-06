import * as THREE from 'three';
import { chunkCoordOfCell, chunkKey } from '../../procgen/chunk';
import type { WorldSampler } from '../../procgen/worldSampler';
import type { Tileset } from '../../world/tiles/tileset';
import { disposeMeshChildren } from './disposeMeshResources';
import { buildChunkMeshGroup } from './worldMeshes';

const VIEW_RADIUS_CHUNKS = 2;
const CHUNK_BUILDS_PER_FRAME = 3;

interface BuiltChunk {
  version: number;
  group: THREE.Group;
}

export class ChunkMeshStreamer {
  private readonly builtChunks = new Map<string, BuiltChunk>();
  private version = 0;

  constructor(
    private readonly root: THREE.Group,
    private readonly sampler: WorldSampler,
    private readonly tileset: Tileset,
  ) {}

  invalidateAll(): void {
    this.version++;
  }

  streamAround(playerX: number, playerY: number): void {
    const centerChunkX = chunkCoordOfCell(playerX);
    const centerChunkY = chunkCoordOfCell(playerY);
    this.dropChunksOutsideRadius(centerChunkX, centerChunkY);
    this.buildNearestStaleChunks(centerChunkX, centerChunkY);
  }

  dispose(): void {
    for (const key of [...this.builtChunks.keys()]) this.dropChunk(key);
  }

  private dropChunksOutsideRadius(centerChunkX: number, centerChunkY: number): void {
    for (const key of [...this.builtChunks.keys()]) {
      const [chunkX, chunkY] = key.split(',').map(Number);
      const distance = Math.max(Math.abs(chunkX! - centerChunkX), Math.abs(chunkY! - centerChunkY));
      if (distance > VIEW_RADIUS_CHUNKS) this.dropChunk(key);
    }
  }

  private buildNearestStaleChunks(centerChunkX: number, centerChunkY: number): void {
    let buildsLeft = CHUNK_BUILDS_PER_FRAME;
    for (const [chunkX, chunkY] of spiralOffsets(centerChunkX, centerChunkY)) {
      if (buildsLeft === 0) return;
      if (this.rebuildIfStale(chunkX, chunkY)) buildsLeft--;
    }
  }

  private rebuildIfStale(chunkX: number, chunkY: number): boolean {
    const key = chunkKey(chunkX, chunkY);
    const existing = this.builtChunks.get(key);
    if (existing && existing.version === this.version) return false;
    if (existing) this.dropChunk(key);
    const group = buildChunkMeshGroup(this.sampler, this.tileset, chunkX, chunkY);
    this.root.add(group);
    this.builtChunks.set(key, { version: this.version, group });
    return true;
  }

  private dropChunk(key: string): void {
    const built = this.builtChunks.get(key);
    if (!built) return;
    this.root.remove(built.group);
    disposeMeshChildren(built.group);
    this.builtChunks.delete(key);
  }
}

function spiralOffsets(centerX: number, centerY: number): [number, number][] {
  const offsets: [number, number][] = [];
  for (let radius = 0; radius <= VIEW_RADIUS_CHUNKS; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        offsets.push([centerX + dx, centerY + dy]);
      }
    }
  }
  return offsets;
}
