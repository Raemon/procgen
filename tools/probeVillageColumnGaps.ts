import '../procgen/nodes';
import { wallLayersOf } from '../assets/cultures/cultureDef';
import { massingFor } from '../procgen/assembly/buildingMassing';
import { massingRulesFor, programNameOf } from '../procgen/assembly/buildingPrograms';
import { roofBaseLayerOf } from '../procgen/assembly/buildingRoof';
import { shellCellsOf } from '../procgen/assembly/buildingShell';
import type { BuildingSpec } from '../procgen/assembly/buildingSpec';
import { tagToSpec } from '../procgen/assembly/buildingSpecTag';
import { chunkCoordOfCell } from '../procgen/chunk';
import { hashString } from '../procgen/random/hashString';
import { mulberry32 } from '../procgen/random/mulberry32';
import { thatchmereVale } from '../procgen/presets/thatchmereVale';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { tileIdOfVoxel } from '../procgen/structureOverlay/packedVoxel';
import { asPoints } from '../procgen/values/valueAccess';
import { worldFromPipelineState, type HeadlessWorld } from './headlessWorld';
import { firstCenterOfNode, villageCenterNodes } from './village/villageSnapshot';

const SEARCH_CHUNKS = 12;
const REGION_CHUNKS = 2;

const world = worldFromPipelineState(thatchmereVale().state as PipelineState);
for (const node of villageCenterNodes(world)) {
  const center = firstCenterOfNode(world, node, SEARCH_CHUNKS);
  if (!center) continue;
  console.log(`\n== ${node.label} at ${center.x},${center.y} ==`);
  for (const spec of buildingsNear(world, center.x, center.y)) reportWallHeights(world, spec);
}

function buildingsNear(world: HeadlessWorld, x: number, y: number): BuildingSpec[] {
  const specs: BuildingSpec[] = [];
  const chunkX = chunkCoordOfCell(x);
  const chunkY = chunkCoordOfCell(y);
  for (let cy = chunkY - REGION_CHUNKS; cy <= chunkY + REGION_CHUNKS; cy++) {
    for (let cx = chunkX - REGION_CHUNKS; cx <= chunkX + REGION_CHUNKS; cx++) {
      specs.push(...plotsInChunk(world, cx, cy));
    }
  }
  return specs;
}

function plotsInChunk(world: HeadlessWorld, chunkX: number, chunkY: number): BuildingSpec[] {
  return world.store
    .nodes()
    .filter((node) => node.enabled && node.type === 'villagePlots')
    .flatMap((node) => asPoints(world.evaluator.valueFor(node.id, chunkX, chunkY)) ?? [])
    .map((point) => tagToSpec(point.tag, point.x, point.y));
}

function reportWallHeights(world: HeadlessWorld, spec: BuildingSpec): void {
  const boxes = massingFor(spec.program, mulberry32(hashString(spec.seedKey)));
  const culture = world.cultureAssets.byId(cultureIdOfPlotAt(world, spec));
  const intendedWallLayers = culture ? wallLayersOf(culture, massingRulesFor(spec.program).stories) : 0;
  const shell = shellCellsOf(boxes).filter((cell) => cell.role !== 'floor');
  const hollow = shell.filter(
    (cell) => !layerIsFilled(world, spec.x + cell.x, spec.y + cell.y, intendedWallLayers),
  );
  console.log(
    `  ${programNameOf(spec.program)} at ${spec.x},${spec.y}: intended wall layers ${intendedWallLayers}, ` +
      `roof starts at ${roofBaseLayerOf(intendedWallLayers)}, ` +
      `${hollow.length}/${shell.length} shell cells empty at the top wall course`,
  );
}

function cultureIdOfPlotAt(world: HeadlessWorld, spec: BuildingSpec): number {
  const nodes = world.store.nodes().filter((node) => node.enabled && node.type === 'villagePlots');
  for (const node of nodes) {
    const points = asPoints(world.evaluator.valueFor(node.id, chunkCoordOfCell(spec.x), chunkCoordOfCell(spec.y))) ?? [];
    if (points.some((point) => point.x === spec.x && point.y === spec.y)) {
      return Number((node.display as { cultureId?: number }).cultureId ?? -1);
    }
  }
  return -1;
}

function layerIsFilled(world: HeadlessWorld, x: number, y: number, layer: number): boolean {
  const column = world.sampler.packedVoxelColumnAt(x, y) ?? [];
  return tileIdOfVoxel(column[layer] ?? -1) >= 0;
}
