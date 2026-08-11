import '@/features/asset-library/worlds/nodes';
import { defaultTileId } from '@/features/asset-library/tiles/defaultTiles';
import { villageFixtureState } from './village/villageFixtureWorld';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { worldFromPipelineState, type HeadlessWorld } from './headlessWorld';
import {
  firstCenterOfNode,
  villageCenterNodes,
  villageSnapshotAround,
  type VillageSnapshot,
} from './village/villageSnapshot';

const SEARCH_CHUNKS = 12;
const REGION_SIDE = 96;

const world = worldFromPipelineState(villageFixtureState());
for (const node of villageCenterNodes(world)) reportVillageOf(world, node);

function reportVillageOf(world: HeadlessWorld, node: NodeInstance): void {
  const center = firstCenterOfNode(world, node, SEARCH_CHUNKS);
  if (!center) {
    console.log(`\n== ${node.label}: none founded within ${SEARCH_CHUNKS} chunks of the origin ==`);
    return;
  }
  reportSnapshot(node, villageSnapshotAround(world, center, REGION_SIDE, doorTileIds()));
}

function doorTileIds(): number[] {
  return [defaultTileId('iron-strapped oak door'), defaultTileId('oak plank door')];
}

function reportSnapshot(node: NodeInstance, snapshot: VillageSnapshot): void {
  console.log(
    `\n== ${node.label} at ${snapshot.center.x},${snapshot.center.y}, sampled ${REGION_SIDE}x${REGION_SIDE} ==`,
  );
  console.log(snapshot.map);
  reportCounts('buildings by program', snapshot.programCounts);
  reportCounts('shaped voxels by tile shape', snapshot.shapeCounts);
  reportDoors(snapshot);
}

function reportCounts(title: string, counts: Map<string, number>): void {
  console.log(`\n-- ${title} --`);
  for (const [name, count] of [...counts].sort(byDescendingCount)) console.log(`  ${name}: ${count}`);
}

function byDescendingCount(a: [string, number], b: [string, number]): number {
  return b[1] - a[1];
}

function reportDoors(snapshot: VillageSnapshot): void {
  const withDoors = snapshot.buildings.length - snapshot.doorlessBuildings.length;
  console.log(`\n-- doors --`);
  console.log(`  ${withDoors}/${snapshot.buildings.length} buildings have a door`);
  for (const spec of snapshot.doorlessBuildings) console.log(`  no door: ${spec.x},${spec.y}`);
}
