import { massingExtent, massingFor } from '../../procgen/assembly/buildingMassing';
import { programNameOf } from '../../procgen/assembly/buildingPrograms';
import type { BuildingSpec } from '../../procgen/assembly/buildingSpec';
import { tagToSpec } from '../../procgen/assembly/buildingSpecTag';
import { chunkCoordOfCell } from '../../procgen/chunk';
import { hashString } from '../../procgen/random/hashString';
import { mulberry32 } from '../../procgen/random/mulberry32';
import { tileIdOfVoxel } from '../../procgen/structureOverlay/packedVoxel';
import { asPoints } from '../../procgen/values/valueAccess';
import type { WorldPoint } from '../../procgen/values/chunkValues';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { TileShapeKind } from '../../assets/tiles/tileShapeKind';
import type { HeadlessWorld } from '../headlessWorld';

export interface SampledRegion {
  minX: number;
  minY: number;
  side: number;
}

export interface VillageSnapshot {
  center: WorldPoint;
  region: SampledRegion;
  map: string;
  programCounts: Map<string, number>;
  shapeCounts: Map<TileShapeKind, number>;
  buildings: BuildingSpec[];
  doorlessBuildings: BuildingSpec[];
}

export function villageSnapshotAround(
  world: HeadlessWorld,
  center: WorldPoint,
  side: number,
  doorTileIds: readonly number[],
): VillageSnapshot {
  const region = regionAround(center, side);
  const buildings = buildingsIn(world, region);
  return {
    center,
    region,
    map: groundMapOf(world, region),
    programCounts: programCountsOf(buildings),
    shapeCounts: shapeCountsOf(world, region),
    buildings,
    doorlessBuildings: buildings.filter((spec) => !hasDoor(world, spec, doorTileIds)),
  };
}

export function villageCenterNodes(world: HeadlessWorld): NodeInstance[] {
  return nodesOfType(world, 'villageCenters');
}

export function firstCenterOfNode(
  world: HeadlessWorld,
  node: NodeInstance,
  searchChunks: number,
): WorldPoint | null {
  for (let chunkY = 0; chunkY < searchChunks; chunkY++) {
    for (let chunkX = 0; chunkX < searchChunks; chunkX++) {
      const found = (asPoints(world.evaluator.valueFor(node.id, chunkX, chunkY)) ?? [])[0];
      if (found) return found;
    }
  }
  return null;
}

function regionAround(center: WorldPoint, side: number): SampledRegion {
  return { minX: center.x - Math.floor(side / 2), minY: center.y - Math.floor(side / 2), side };
}

function nodesOfType(world: HeadlessWorld, type: string): NodeInstance[] {
  return world.store.nodes().filter((node) => node.enabled && node.type === type);
}

function pointsOfType(
  world: HeadlessWorld,
  type: string,
  chunkX: number,
  chunkY: number,
): WorldPoint[] {
  return nodesOfType(world, type).flatMap(
    (node) => asPoints(world.evaluator.valueFor(node.id, chunkX, chunkY)) ?? [],
  );
}

function buildingsIn(world: HeadlessWorld, region: SampledRegion): BuildingSpec[] {
  const specs: BuildingSpec[] = [];
  const maxX = region.minX + region.side - 1;
  const maxY = region.minY + region.side - 1;
  for (let chunkY = chunkCoordOfCell(region.minY); chunkY <= chunkCoordOfCell(maxY); chunkY++) {
    for (let chunkX = chunkCoordOfCell(region.minX); chunkX <= chunkCoordOfCell(maxX); chunkX++) {
      collectPlotsInChunk(world, region, chunkX, chunkY, specs);
    }
  }
  return specs;
}

function collectPlotsInChunk(
  world: HeadlessWorld,
  region: SampledRegion,
  chunkX: number,
  chunkY: number,
  into: BuildingSpec[],
): void {
  for (const point of pointsOfType(world, 'villagePlots', chunkX, chunkY)) {
    if (isInsideRegion(region, point.x, point.y)) into.push(tagToSpec(point.tag, point.x, point.y));
  }
}

function isInsideRegion(region: SampledRegion, x: number, y: number): boolean {
  return (
    x >= region.minX && y >= region.minY && x < region.minX + region.side && y < region.minY + region.side
  );
}

function groundMapOf(world: HeadlessWorld, region: SampledRegion): string {
  const rows: string[] = [];
  for (let y = region.minY; y < region.minY + region.side; y++) {
    rows.push(groundRowOf(world, region, y));
  }
  return rows.join('\n');
}

function groundRowOf(world: HeadlessWorld, region: SampledRegion, y: number): string {
  let row = '';
  for (let x = region.minX; x < region.minX + region.side; x++) {
    row += world.tileAssets.byId(visibleTileIdAt(world, x, y))?.symbol ?? ' ';
  }
  return row;
}

function visibleTileIdAt(world: HeadlessWorld, x: number, y: number): number {
  const top = world.sampler.topVoxelTileIdAt(x, y);
  return top < 0 ? world.sampler.tileAt(x, y) : top;
}

function programCountsOf(buildings: readonly BuildingSpec[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const spec of buildings) {
    const name = programNameOf(spec.program);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

function shapeCountsOf(world: HeadlessWorld, region: SampledRegion): Map<TileShapeKind, number> {
  const counts = new Map<TileShapeKind, number>();
  for (let y = region.minY; y < region.minY + region.side; y++) {
    for (let x = region.minX; x < region.minX + region.side; x++) countShapesInColumn(world, x, y, counts);
  }
  return counts;
}

function countShapesInColumn(
  world: HeadlessWorld,
  x: number,
  y: number,
  counts: Map<TileShapeKind, number>,
): void {
  const column = world.sampler.packedVoxelColumnAt(x, y) ?? [];
  for (let layer = 1; layer < column.length; layer++) {
    const tile = world.tileAssets.byId(tileIdOfVoxel(column[layer] ?? -1));
    if (tile) counts.set(tile.shape, (counts.get(tile.shape) ?? 0) + 1);
  }
}

function hasDoor(
  world: HeadlessWorld,
  spec: BuildingSpec,
  doorTileIds: readonly number[],
): boolean {
  const extent = massingExtent(massingFor(spec.program, mulberry32(hashString(spec.seedKey))));
  for (let y = spec.y; y < spec.y + extent.depth; y++) {
    for (let x = spec.x; x < spec.x + extent.width; x++) {
      if (columnHoldsAnyTile(world, x, y, doorTileIds)) return true;
    }
  }
  return false;
}

function columnHoldsAnyTile(
  world: HeadlessWorld,
  x: number,
  y: number,
  tileIds: readonly number[],
): boolean {
  const column = world.sampler.packedVoxelColumnAt(x, y) ?? [];
  return column.some((packed) => tileIds.includes(tileIdOfVoxel(packed)));
}
