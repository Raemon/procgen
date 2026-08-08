import '../procgen/nodes';
import { CHUNK_SIZE, chunkCoordOfCell, chunkOrigin } from '../procgen/chunk';
import { thatchmereVale } from '../procgen/presets/thatchmereVale';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { insideChunk, placementsAroundChunk } from '../world/render/view3d/culling/chunkSurroundings';
import { occluderFieldOfPlacements } from '../world/render/view3d/culling/occluderFieldOfPlacements';
import { EVERY_FACE, visibleFacesOf } from '../world/render/view3d/culling/visibleFaceMask';
import { blockShape, floorShape, voxelShape } from '../world/render/view3d/tileShapes';
import type { TilePlacement } from '../world/render/view3d/tilePlacements';
import { worldFromPipelineState } from './headlessWorld';
import { firstCenterOfNode, villageCenterNodes } from './village/villageSnapshot';

const world = worldFromPipelineState(thatchmereVale().state as PipelineState);
const node = villageCenterNodes(world)[0]!;
const center = firstCenterOfNode(world, node, 12)!;
const chunkX = chunkCoordOfCell(center.x);
const chunkY = chunkCoordOfCell(center.y);
const minX = chunkOrigin(chunkX);
const minY = chunkOrigin(chunkY);
console.log(`village ${center.x},${center.y} in chunk ${chunkX},${chunkY} origin ${minX},${minY}`);

const around = placementsAroundChunk(world.sampler, world.tileAssets, minX, minY);
const field = occluderFieldOfPlacements(around.window, [
  { placements: around.floors, shape: floorShape() },
  { placements: around.blocks, shape: blockShape() },
  { placements: around.voxels, shape: voxelShape() },
]);

const voxels = insideChunk(around.voxels, minX, minY);
const shaped = insideChunk(around.shaped, minX, minY);
console.log(`floors ${insideChunk(around.floors, minX, minY).length}`);
console.log(`blocks ${insideChunk(around.blocks, minX, minY).length}`);
console.log(`cube voxels ${voxels.length}`);
console.log(`shaped ${shaped.length}`);
console.log(`ceilings ${insideChunk(around.ceilings, minX, minY).length}`);

const box = voxelShape().occluderBoxOf!;
let fullyCulled = 0;
const faceCounts = new Map<number, number>();
for (const placement of voxels) {
  const faces = visibleFacesOf(field, placement.x, placement.y, box(placement));
  if (faces === 0) fullyCulled++;
  faceCounts.set(faces, (faceCounts.get(faces) ?? 0) + 1);
}
console.log(`\ncube voxels fully culled: ${fullyCulled} of ${voxels.length}`);
for (const [faces, count] of [...faceCounts].sort((a, b) => b[1] - a[1])) {
  console.log(`  faces ${faces}${faces === EVERY_FACE ? ' (all)' : ''}: ${count}`);
}

console.log('\nabove-ground cube voxels by elevation:');
for (const [elevation, count] of elevationHistogram(voxels)) console.log(`  ${elevation}: ${count}`);
console.log('\nabove-ground shaped placements by elevation:');
for (const [elevation, count] of elevationHistogram(shaped)) console.log(`  ${elevation}: ${count}`);

function elevationHistogram(placements: readonly TilePlacement[]): [number, number][] {
  const counts = new Map<number, number>();
  for (const placement of placements) {
    const rounded = Math.round(placement.elevation);
    counts.set(rounded, (counts.get(rounded) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => a[0] - b[0]);
}

console.log(`\nchunk side ${CHUNK_SIZE}`);
