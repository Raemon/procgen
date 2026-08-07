import type { CubeFaceArt } from '../world/tiles/tileFaceArt';
import type { Tileset } from '../world/tiles/tileset';
import { cellIndexInChunk, chunkCoordOfCell } from './chunk';
import { markerAppearance } from './display/markerAppearance';
import type { PipelineEvaluator } from './eval/evaluator';
import type { NodeInstance } from './pipeline/pipelineState';
import type { PipelineStore } from './pipeline/pipelineStore';
import { groundVoxelOf, topVoxelOf, type VoxelColumn } from './prefabOverlay/chunkVoxelColumns';
import { PrefabOverlay, NO_PREFABS, type PrefabSource } from './prefabOverlay/prefabOverlay';
import type { PrefabPlacement } from './prefabOverlay/prefabPlacement';
import { EMPTY_TILE } from './values/chunkValues';
import { asField, asPoints, asTiles } from './values/valueAccess';

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

export class WorldSampler {
  private readonly prefabOverlay: PrefabOverlay;

  constructor(
    private readonly store: PipelineStore,
    private readonly evaluator: PipelineEvaluator,
    private readonly tileset: Tileset,
    prefabs: PrefabSource = NO_PREFABS,
  ) {
    this.prefabOverlay = new PrefabOverlay(prefabs, (chunkX, chunkY) =>
      this.prefabPlacementsInChunk(chunkX, chunkY),
    );
  }

  invalidatePrefabOverlay(): void {
    this.prefabOverlay.invalidate();
  }

  tileAt(x: number, y: number): number {
    const ground = groundVoxelOf(this.voxelColumnAt(x, y));
    return ground === EMPTY_TILE ? this.tileFromLayers(x, y) : ground;
  }

  voxelColumnAt(x: number, y: number): VoxelColumn | null {
    return this.prefabOverlay.columnAt(x, y);
  }

  topVoxelAt(x: number, y: number): number {
    return topVoxelOf(this.voxelColumnAt(x, y));
  }

  elevationAt(x: number, y: number): number {
    const bound = this.displayedNodes('elevation');
    const node = bound[bound.length - 1];
    if (!node || node.display.mode !== 'elevation') return 0;
    const field = asField(this.chunkValueAt(node, x, y));
    return (field?.[cellIndexInChunk(x, y)] ?? 0) * node.display.heightScale;
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

  private tileFromLayers(x: number, y: number): number {
    let tile = EMPTY_TILE;
    for (const node of this.displayedNodes('tileLayer')) {
      const layerTile = this.tileFromNode(node, x, y);
      if (layerTile !== EMPTY_TILE) tile = layerTile;
    }
    return tile;
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
    return this.store.nodes().filter((node) => node.enabled && node.display.mode === mode);
  }

  private tileFromNode(node: NodeInstance, x: number, y: number): number {
    const tiles = asTiles(this.chunkValueAt(node, x, y));
    return tiles?.[cellIndexInChunk(x, y)] ?? EMPTY_TILE;
  }

  private chunkValueAt(node: NodeInstance, x: number, y: number) {
    return this.evaluator.valueFor(node.id, chunkCoordOfCell(x), chunkCoordOfCell(y));
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
