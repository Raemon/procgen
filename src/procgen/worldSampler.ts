import type { CubeFaceArt } from '../world/tiles/tileFaceArt';
import type { Tileset } from '../world/tiles/tileset';
import { cellIndexInChunk, chunkCoordOfCell } from './chunk';
import { markerAppearance } from './display/markerAppearance';
import type { PipelineEvaluator } from './eval/evaluator';
import type { NodeInstance } from './pipeline/pipelineState';
import type { PipelineStore } from './pipeline/pipelineStore';
import { topVoxelOf, type VoxelColumn } from './prefabOverlay/chunkVoxelColumns';
import { PrefabOverlay, NO_PREFABS, type PrefabSource } from './prefabOverlay/prefabOverlay';
import type { PrefabPlacement } from './prefabOverlay/prefabPlacement';
import { buildSampledChunk } from './sampling/buildSampledChunk';
import { SampledChunkCache, type SampledChunk } from './sampling/sampledChunkCache';
import { asPoints } from './values/valueAccess';

export interface Marker {
  x: number;
  y: number;
  glyph: string;
  color: string;
  faceArt: CubeFaceArt | null;
  tag: string;
}

export interface CreatureSpawn {
  x: number;
  y: number;
  creatureId: number;
  tag: string;
}

type DisplayedMode = 'tileLayer' | 'elevation' | 'markers' | 'prefabs' | 'creatures';

const SAMPLED_CHUNKS_KEPT = 512;

export class WorldSampler {
  private readonly prefabOverlay: PrefabOverlay;
  private readonly sampledChunks = new SampledChunkCache(SAMPLED_CHUNKS_KEPT);
  private readonly displayedByMode = new Map<DisplayedMode, NodeInstance[]>();

  constructor(
    private readonly store: PipelineStore,
    private readonly evaluator: PipelineEvaluator,
    private readonly tileset: Tileset,
    prefabs: PrefabSource = NO_PREFABS,
  ) {
    this.prefabOverlay = new PrefabOverlay(prefabs, (chunkX, chunkY) =>
      this.prefabPlacementsInChunk(chunkX, chunkY),
    );
    store.onChange(() => this.dropSampledState());
  }

  invalidatePrefabOverlay(): void {
    this.prefabOverlay.invalidate();
    this.sampledChunks.clear();
  }

  tileAt(x: number, y: number): number {
    return this.sampledChunkOfCell(x, y).tiles[cellIndexInChunk(x, y)]!;
  }

  voxelColumnAt(x: number, y: number): VoxelColumn | null {
    return this.sampledChunkOfCell(x, y).columns.columnAt(cellIndexInChunk(x, y));
  }

  topVoxelAt(x: number, y: number): number {
    return topVoxelOf(this.voxelColumnAt(x, y));
  }

  elevationAt(x: number, y: number): number {
    return this.sampledChunkOfCell(x, y).elevation[cellIndexInChunk(x, y)]!;
  }

  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[] {
    const markers: Marker[] = [];
    for (const node of this.displayedNodes('markers')) {
      this.collectMarkersFromNode(node, minX, minY, maxX, maxY, markers);
    }
    return markers;
  }

  creatureSpawnsIn(minX: number, minY: number, maxX: number, maxY: number): CreatureSpawn[] {
    const spawns: CreatureSpawn[] = [];
    for (const node of this.displayedNodes('creatures')) {
      if (node.display.mode !== 'creatures') continue;
      const creatureId = node.display.creatureId;
      for (const point of this.pointsInRect(node, minX, minY, maxX, maxY)) {
        spawns.push({ x: point.x, y: point.y, creatureId, tag: point.tag });
      }
    }
    return spawns;
  }

  private sampledChunkOfCell(x: number, y: number): SampledChunk {
    const chunkX = chunkCoordOfCell(x);
    const chunkY = chunkCoordOfCell(y);
    return this.sampledChunks.at(chunkX, chunkY, () =>
      buildSampledChunk(
        this.evaluator,
        this.displayedNodes('tileLayer'),
        this.lastElevationNode(),
        this.prefabOverlay.columnsForChunk(chunkX, chunkY),
        chunkX,
        chunkY,
      ),
    );
  }

  private lastElevationNode(): NodeInstance | undefined {
    const bound = this.displayedNodes('elevation');
    return bound[bound.length - 1];
  }

  private dropSampledState(): void {
    this.sampledChunks.clear();
    this.displayedByMode.clear();
  }

  private prefabPlacementsInChunk(chunkX: number, chunkY: number): PrefabPlacement[] {
    const placements: PrefabPlacement[] = [];
    for (const node of this.displayedNodes('prefabs')) {
      if (node.display.mode !== 'prefabs' || node.display.prefabId < 0) continue;
      const { prefabId, rotation } = node.display;
      const points = asPoints(this.evaluator.valueFor(node.id, chunkX, chunkY)) ?? [];
      for (const point of points) placements.push({ x: point.x, y: point.y, prefabId, rotation });
    }
    return placements;
  }

  private displayedNodes(mode: DisplayedMode): NodeInstance[] {
    const memoized = this.displayedByMode.get(mode);
    if (memoized) return memoized;
    const nodes = this.store
      .nodes()
      .filter((node) => node.enabled && node.display.mode === mode);
    this.displayedByMode.set(mode, nodes);
    return nodes;
  }

  private pointsInRect(
    node: NodeInstance,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): { x: number; y: number; tag: string }[] {
    const inside: { x: number; y: number; tag: string }[] = [];
    for (let chunkY = chunkCoordOfCell(minY); chunkY <= chunkCoordOfCell(maxY); chunkY++) {
      for (let chunkX = chunkCoordOfCell(minX); chunkX <= chunkCoordOfCell(maxX); chunkX++) {
        const points = asPoints(this.evaluator.valueFor(node.id, chunkX, chunkY)) ?? [];
        for (const point of points) {
          if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
            inside.push(point);
          }
        }
      }
    }
    return inside;
  }

  private collectMarkersFromNode(
    node: NodeInstance,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    into: Marker[],
  ): void {
    if (node.display.mode !== 'markers') return;
    const look = markerAppearance(this.tileset, node.display);
    for (const point of this.pointsInRect(node, minX, minY, maxX, maxY)) {
      into.push({ x: point.x, y: point.y, ...look, tag: point.tag });
    }
  }
}
