import type { CreatureId, ItemId } from '@/features/asset-library/asset';
import type { TileId } from '@/features/asset-library/asset';
import { NO_ITEMS, type ItemSource } from '@/features/asset-library/items/itemAssets';
import { measureWork } from '@/features/game/performance/workTimers';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { cellIndexInChunk, chunkCoordOfCell } from './chunk';
import { markerAppearance } from './display/markerAppearance';
import type { PipelineEvaluator } from './eval/evaluator';
import { featureLabelOfTag } from './features/featureLabelOfTag';
import { nodeTypeOf } from './nodeRegistry';
import type { NodeInstance } from './pipeline/pipelineState';
import type { PipelineStore } from './pipeline/pipelineStore';
import { topPackedVoxelOf, type VoxelColumn } from './structureOverlay/chunkVoxelColumns';
import { tileIdOfVoxel } from './structureOverlay/packedVoxel';
import {
  StructureOverlay,
  NO_CULTURES,
  NO_PIECES,
  type CultureSource,
  type PieceSource,
} from './structureOverlay/structureOverlay';
import type { PiecePlacement } from './structureOverlay/piecePlacement';
import type {
  CultureStructurePlacement,
  StructurePlacement,
} from './structureOverlay/structurePlacement';
import { buildSampledChunk } from './sampling/buildSampledChunk';
import { SampledChunkCache, type SampledChunk } from './sampling/sampledChunkCache';
import { pointsInRect } from './values/pointsInRect';
import { asPoints } from './values/valueAccess';

export interface Marker {
  x: number;
  y: number;
  glyph: string;
  color: string;
  faceArt: CubeFaceArt | null;
  tag: string;
  standingHeight?: number;
  standingFootprint?: readonly [number, number];
  billboardHeight?: number;
  seeThroughUnpaintedArt?: boolean;
}

export interface CreatureSpawn {
  x: number;
  y: number;
  creatureId: CreatureId;
  tag: string;
}

export interface ItemSpawn {
  x: number;
  y: number;
  itemId: ItemId;
  name: string;
  glyph: string;
  color: string;
  tag: string;
}

type DisplayedMode =
  | 'tileLayer'
  | 'ceiling'
  | 'elevation'
  | 'markers'
  | 'pieces'
  | 'structures'
  | 'creatures'
  | 'items';

const SAMPLED_CHUNKS_KEPT = 512;

export class WorldSampler {
  private readonly structureOverlay: StructureOverlay;
  private readonly sampledChunks = new SampledChunkCache(SAMPLED_CHUNKS_KEPT);
  private readonly displayedByMode = new Map<DisplayedMode, NodeInstance[]>();

  constructor(
    private readonly store: PipelineStore,
    private readonly evaluator: PipelineEvaluator,
    private readonly tileAssets: TileAssets,
    pieces: PieceSource = NO_PIECES,
    private readonly items: ItemSource = NO_ITEMS,
    private readonly takenItems: TakenItemSpawns = new TakenItemSpawns(),
    cultures: CultureSource = NO_CULTURES,
  ) {
    this.structureOverlay = new StructureOverlay(
      pieces,
      (chunkX, chunkY) => this.structurePlacementsInChunk(chunkX, chunkY),
      cultures,
    );
    store.onChange(() => this.dropSampledState());
  }

  invalidateStructureOverlay(): void {
    this.structureOverlay.invalidate();
    this.sampledChunks.clear();
  }

  tileAt(x: number, y: number): TileId {
    return this.sampledChunkOfCell(x, y).tiles[cellIndexInChunk(x, y)]! as TileId;
  }

  packedVoxelColumnAt(x: number, y: number): VoxelColumn | null {
    return this.sampledChunkOfCell(x, y).columns.packedColumnAt(cellIndexInChunk(x, y));
  }

  topVoxelTileIdAt(x: number, y: number): TileId {
    return tileIdOfVoxel(topPackedVoxelOf(this.packedVoxelColumnAt(x, y)));
  }

  groundFacingAt(x: number, y: number): number {
    return this.sampledChunkOfCell(x, y).groundFacing[cellIndexInChunk(x, y)]!;
  }

  ceilingTileAt(x: number, y: number): TileId {
    return this.sampledChunkOfCell(x, y).ceiling.tiles[cellIndexInChunk(x, y)]! as TileId;
  }

  ceilingHeightAt(x: number, y: number): number {
    return this.sampledChunkOfCell(x, y).ceiling.height[cellIndexInChunk(x, y)]!;
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

  itemSpawnsIn(minX: number, minY: number, maxX: number, maxY: number): ItemSpawn[] {
    const spawns: ItemSpawn[] = [];
    for (const node of this.displayedNodes('items')) {
      if (node.display.mode !== 'items') continue;
      const item = this.items.byId(node.display.itemId);
      if (!item) continue;
      for (const point of this.pointsInRect(node, minX, minY, maxX, maxY)) {
        if (this.takenItems.isTaken({ x: point.x, y: point.y, itemId: item.id })) continue;
        spawns.push({
          x: point.x,
          y: point.y,
          itemId: item.id,
          name: item.name,
          glyph: item.symbol,
          color: item.color,
          tag: point.tag,
        });
      }
    }
    return spawns;
  }

  private sampledChunkOfCell(x: number, y: number): SampledChunk {
    const chunkX = chunkCoordOfCell(x);
    const chunkY = chunkCoordOfCell(y);
    return this.sampledChunks.at(chunkX, chunkY, () =>
      measureWork('procgen chunk sampling', () =>
        buildSampledChunk(
          this.evaluator,
          {
            tileLayers: this.displayedNodes('tileLayer'),
            ceilings: this.displayedNodes('ceiling'),
            elevation: this.lastElevationNode(),
          },
          this.structureOverlay.columnsForChunk(chunkX, chunkY),
          chunkX,
          chunkY,
        ),
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

  private structurePlacementsInChunk(chunkX: number, chunkY: number): StructurePlacement[] {
    return [
      ...this.piecePlacementsInChunk(chunkX, chunkY),
      ...this.culturePlacementsInChunk(chunkX, chunkY),
    ];
  }

  private piecePlacementsInChunk(chunkX: number, chunkY: number): PiecePlacement[] {
    const placements: PiecePlacement[] = [];
    for (const node of this.displayedNodes('pieces')) {
      if (node.display.mode !== 'pieces' || node.display.pieceId < 0) continue;
      const { pieceId, rotation } = node.display;
      for (const point of this.pointsOfNode(node, chunkX, chunkY)) {
        placements.push({ x: point.x, y: point.y, pieceId, rotation });
      }
    }
    return placements;
  }

  private culturePlacementsInChunk(
    chunkX: number,
    chunkY: number,
  ): CultureStructurePlacement[] {
    const placements: CultureStructurePlacement[] = [];
    for (const node of this.displayedNodes('structures')) {
      if (node.display.mode !== 'structures' || node.display.cultureId < 0) continue;
      const { cultureId } = node.display;
      for (const point of this.pointsOfNode(node, chunkX, chunkY)) {
        placements.push({ x: point.x, y: point.y, cultureId, tag: point.tag, data: point.data });
      }
    }
    return placements;
  }

  private pointsOfNode(node: NodeInstance, chunkX: number, chunkY: number) {
    return asPoints(this.evaluator.valueFor(node.id, chunkX, chunkY)) ?? [];
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
    return pointsInRect(this.evaluator, node.id, { minX, minY, maxX, maxY });
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
    const look = markerAppearance(this.tileAssets, node.display);
    const def = nodeTypeOf(node.type);
    for (const point of this.pointsInRect(node, minX, minY, maxX, maxY)) {
      into.push({ x: point.x, y: point.y, ...look, tag: def ? featureLabelOfTag(point, node, def) : point.tag });
    }
  }
}
