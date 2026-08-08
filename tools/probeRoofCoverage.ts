import '../procgen/nodes';
import { wallLayersOf } from '../assets/cultures/cultureDef';
import { massingFor } from '../procgen/assembly/buildingMassing';
import { massingRulesFor, programNameOf } from '../procgen/assembly/buildingPrograms';
import { forEachFootprintCell } from '../procgen/assembly/buildingShell';
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

const world = worldFromPipelineState(thatchmereVale().state as PipelineState);
for (const node of villageCenterNodes(world)) {
  const center = firstCenterOfNode(world, node, 12);
  if (!center) continue;
  console.log(`\n== ${node.label} at ${center.x},${center.y} ==`);
  for (const plot of plotsNear(world, center.x, center.y)) reportRoof(world, plot.spec, plot.cultureId);
}

function plotsNear(world: HeadlessWorld, x: number, y: number) {
  const found: { spec: BuildingSpec; cultureId: number }[] = [];
  const nodes = world.store.nodes().filter((node) => node.enabled && node.type === 'villagePlots');
  for (let cy = chunkCoordOfCell(y) - 1; cy <= chunkCoordOfCell(y) + 1; cy++) {
    for (let cx = chunkCoordOfCell(x) - 1; cx <= chunkCoordOfCell(x) + 1; cx++) {
      for (const node of nodes) {
        const cultureId = Number((node.display as { cultureId?: number }).cultureId ?? -1);
        for (const point of asPoints(world.evaluator.valueFor(node.id, cx, cy)) ?? []) {
          found.push({ spec: tagToSpec(point.tag, point.x, point.y), cultureId });
        }
      }
    }
  }
  return found;
}

function reportRoof(world: HeadlessWorld, spec: BuildingSpec, cultureId: number): void {
  const culture = world.cultureAssets.byId(cultureId);
  if (!culture) return;
  const boxes = massingFor(spec.program, mulberry32(hashString(spec.seedKey)));
  const wallLayers = wallLayersOf(culture, massingRulesFor(spec.program).stories);
  let covered = 0;
  let bare = 0;
  forEachFootprintCell(boxes, (x, y) => {
    if (anyVoxelAbove(world, spec.x + x, spec.y + y, wallLayers)) covered++;
    else bare++;
  });
  console.log(
    `  ${culture.name} ${programNameOf(spec.program)} at ${spec.x},${spec.y}: ${covered} roofed cells, ${bare} bare`,
  );
}

function anyVoxelAbove(world: HeadlessWorld, x: number, y: number, wallLayers: number): boolean {
  const column = world.sampler.packedVoxelColumnAt(x, y) ?? [];
  for (let layer = wallLayers + 1; layer < column.length; layer++) {
    if (tileIdOfVoxel(column[layer] ?? -1) >= 0) return true;
  }
  return false;
}
