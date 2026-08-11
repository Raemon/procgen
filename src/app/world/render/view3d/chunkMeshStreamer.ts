import * as THREE from 'three';
import { CHUNK_SIZE, chunkCoordOfCell, chunkKey, chunkOrigin } from '../../../procgen/chunk';
import type { WorldSampler } from '../../../procgen/worldSampler';
import type { ReadOnlyTileAssets } from '../../../frontend/readOnlyAssets';
import { measureWork } from '../../../perf/workTimers';
import type { MarkerSource } from '../markerSource';
import { applyTileSideBudget } from './chunkDetail';
import { disposeMeshChildren } from './disposeMeshResources';
import { tileSideBudget } from './tileDetailBudget';
import { MAX_FACE_ART_SIZE } from '../../../assets/tiles/tileFaceArt';
import { buildChunkMeshGroup, CEILING_GROUP_NAME } from './worldMeshes';

const CHUNK_BUILD_BUDGET_MS_PER_FRAME = 8;

interface BuiltChunk {
  version: number;
  group: THREE.Group;
  sideBudget: number;
}

export class ChunkMeshStreamer {
  private readonly builtChunks = new Map<string, BuiltChunk>();
  private version = 0;
  private ceilingsVisible = false;
  private sideBudgetAtChunk: (chunkX: number, chunkY: number) => number = () => MAX_FACE_ART_SIZE;

  constructor(
    private readonly root: THREE.Group,
    private readonly sampler: WorldSampler,
    private readonly tileAssets: ReadOnlyTileAssets,
    private readonly extraMarkers: MarkerSource,
  ) {}

  invalidateAll(): void {
    this.version++;
  }

  showCeilings(visible: boolean): void {
    this.ceilingsVisible = visible;
    for (const built of this.builtChunks.values()) this.applyCeilingVisibility(built.group);
  }

  detailFromCamera(
    camera: THREE.PerspectiveCamera,
    viewportHeightPixels: number,
    groundElevation: number,
  ): void {
    this.sideBudgetAtChunk = (chunkX, chunkY) =>
      tileSideBudget(
        camera.fov,
        viewportHeightPixels,
        distanceToChunk(camera, groundElevation, chunkX, chunkY),
      );
    for (const [key, built] of this.builtChunks) this.applyDetail(key, built);
  }

  streamAround(centerX: number, centerY: number, radiusChunks: number): void {
    const centerChunkX = chunkCoordOfCell(centerX);
    const centerChunkY = chunkCoordOfCell(centerY);
    this.dropChunksOutsideRadius(centerChunkX, centerChunkY, radiusChunks);
    this.buildNearestStaleChunks(centerChunkX, centerChunkY, radiusChunks);
  }

  dispose(): void {
    for (const key of [...this.builtChunks.keys()]) this.dropChunk(key);
  }

  private dropChunksOutsideRadius(
    centerChunkX: number,
    centerChunkY: number,
    radiusChunks: number,
  ): void {
    for (const key of [...this.builtChunks.keys()]) {
      const [chunkX, chunkY] = key.split(',').map(Number);
      const distance = Math.max(Math.abs(chunkX! - centerChunkX), Math.abs(chunkY! - centerChunkY));
      if (distance > radiusChunks) this.dropChunk(key);
    }
  }

  private buildNearestStaleChunks(
    centerChunkX: number,
    centerChunkY: number,
    radiusChunks: number,
  ): void {
    const deadline = performance.now() + CHUNK_BUILD_BUDGET_MS_PER_FRAME;
    for (const [chunkX, chunkY] of spiralOffsets(centerChunkX, centerChunkY, radiusChunks)) {
      if (performance.now() >= deadline) return;
      this.rebuildIfStale(chunkX, chunkY);
    }
  }

  private rebuildIfStale(chunkX: number, chunkY: number): boolean {
    const key = chunkKey(chunkX, chunkY);
    const existing = this.builtChunks.get(key);
    if (existing && existing.version === this.version) return false;
    if (existing) this.dropChunk(key);
    const group = measureWork('chunk meshing', () =>
      buildChunkMeshGroup(this.sampler, this.tileAssets, chunkX, chunkY, this.extraMarkers),
    );
    this.applyCeilingVisibility(group);
    this.root.add(group);
    const built = { version: this.version, group, sideBudget: MAX_FACE_ART_SIZE };
    this.builtChunks.set(key, built);
    this.applyDetail(key, built);
    return true;
  }

  private applyDetail(key: string, built: BuiltChunk): void {
    const [chunkX, chunkY] = key.split(',').map(Number);
    const sideBudget = this.sideBudgetAtChunk(chunkX!, chunkY!);
    if (sideBudget === built.sideBudget) return;
    built.sideBudget = sideBudget;
    applyTileSideBudget(built.group, sideBudget);
  }

  private applyCeilingVisibility(group: THREE.Group): void {
    const ceiling = group.getObjectByName(CEILING_GROUP_NAME);
    if (ceiling) ceiling.visible = this.ceilingsVisible;
  }

  private dropChunk(key: string): void {
    const built = this.builtChunks.get(key);
    if (!built) return;
    this.root.remove(built.group);
    disposeMeshChildren(built.group);
    this.builtChunks.delete(key);
  }
}

function distanceToChunk(
  camera: THREE.PerspectiveCamera,
  groundElevation: number,
  chunkX: number,
  chunkY: number,
): number {
  return Math.hypot(
    gapOutsideChunk(camera.position.x, chunkOrigin(chunkX)),
    camera.position.y - groundElevation,
    gapOutsideChunk(camera.position.z, chunkOrigin(chunkY)),
  );
}

function gapOutsideChunk(cameraCoord: number, chunkOriginCoord: number): number {
  if (cameraCoord < chunkOriginCoord) return chunkOriginCoord - cameraCoord;
  const far = chunkOriginCoord + CHUNK_SIZE;
  return cameraCoord > far ? cameraCoord - far : 0;
}

function spiralOffsets(
  centerX: number,
  centerY: number,
  radiusChunks: number,
): [number, number][] {
  const offsets: [number, number][] = [];
  for (let radius = 0; radius <= radiusChunks; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        offsets.push([centerX + dx, centerY + dy]);
      }
    }
  }
  return offsets;
}
