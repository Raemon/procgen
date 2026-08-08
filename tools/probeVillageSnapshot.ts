import '../procgen/nodes';
import { defaultTileId } from '../assets/tiles/defaultTiles';
import { thatchmereVale } from '../procgen/presets/thatchmereVale';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { worldFromPipelineState } from './headlessWorld';
import { firstVillageCenter, villageSnapshotAround, type VillageSnapshot } from './village/villageSnapshot';

const SEARCH_CHUNKS = 12;
const REGION_SIDE = 96;

const world = worldFromPipelineState(thatchmereVale().state as PipelineState);
const center = firstVillageCenter(world, SEARCH_CHUNKS);

if (!center) {
  console.log(`no village center found within ${SEARCH_CHUNKS} chunks of the origin`);
} else {
  reportSnapshot(villageSnapshotAround(world, center, REGION_SIDE, doorTileIds()));
}

function doorTileIds(): number[] {
  return [defaultTileId('iron-strapped oak door'), defaultTileId('oak plank door')];
}

function reportSnapshot(snapshot: VillageSnapshot): void {
  console.log(`== village at ${snapshot.center.x},${snapshot.center.y} in a ${REGION_SIDE}x${REGION_SIDE} window ==`);
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
  console.log(`\n-- doors --`);
  console.log(`  ${snapshot.buildings.length - snapshot.doorlessBuildings.length}/${snapshot.buildings.length} buildings have a door`);
  for (const spec of snapshot.doorlessBuildings) {
    console.log(`  no door: ${spec.x},${spec.y}`);
  }
}
