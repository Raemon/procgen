import '../procgen/nodes';
import { thatchmereVale } from '../procgen/presets/thatchmereVale';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { tileIdOfVoxel } from '../procgen/structureOverlay/packedVoxel';
import { worldFromPipelineState } from './headlessWorld';
import { firstCenterOfNode, villageCenterNodes } from './village/villageSnapshot';

const world = worldFromPipelineState(thatchmereVale().state as PipelineState);
const node = villageCenterNodes(world)[0]!;
const center = firstCenterOfNode(world, node, 12)!;
console.log(`center ${center.x},${center.y}`);
const minX = center.x - 20;
const minY = center.y - 20;
for (let layer = 0; layer < 8; layer++) {
  console.log(`\n-- layer ${layer} --`);
  for (let y = minY; y < minY + 24; y++) {
    let row = '';
    for (let x = minX; x < minX + 40; x++) {
      const column = world.sampler.packedVoxelColumnAt(x, y) ?? [];
      const tile = world.tileAssets.byId(tileIdOfVoxel(column[layer] ?? -1));
      row += tile ? tile.symbol : '.';
    }
    console.log(row);
  }
}
console.log('\nelevation row:');
let row = '';
for (let x = minX; x < minX + 40; x++) row += String(world.sampler.elevationAt(x, center.y)).padStart(4);
console.log(row);
