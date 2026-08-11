import '@/features/asset-library/worlds/nodes';
import { infiniteLabyrinth } from '@/features/asset-library/worlds/presets/infiniteLabyrinth';
import { volcanicIslands } from '@/features/asset-library/worlds/presets/volcanicIslands';
import { buildChunkMeshGroup } from '@/features/game/render/view3d/worldMeshes';
import { drawLoadLine, drawLoadOf } from './chunkDrawLoad';
import { worldFromPipelineState, type HeadlessWorld } from './headlessWorld';
import { stubTheCanvasTexturesAreRasterizedOnto } from './stubCanvasForHeadlessTextures';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';

const OPEN_SKY_CHUNKS = [
  [0, 0],
  [10, 4],
] as const;
const DELVE_CHUNKS = [
  [0, 0],
  [3, 2],
] as const;

stubTheCanvasTexturesAreRasterizedOnto();

reportChunks('above ground in the volcanic islands', volcanicIslands().state, OPEN_SKY_CHUNKS);
reportChunks('inside the infinite labyrinth', infiniteLabyrinth().state, DELVE_CHUNKS);

function reportChunks(
  title: string,
  state: unknown,
  chunks: readonly (readonly [number, number])[],
): void {
  const world = worldFromPipelineState(state as PipelineState);
  console.log(`== what one chunk ${title} draws ==`);
  for (const [chunkX, chunkY] of chunks) console.log(`  ${chunkLine(world, chunkX, chunkY)}`);
}

function chunkLine(world: HeadlessWorld, chunkX: number, chunkY: number): string {
  const chunk = buildChunkMeshGroup(world.sampler, world.tileAssets, chunkX, chunkY);
  return `chunk ${chunkX},${chunkY}: ${drawLoadLine(drawLoadOf(chunk))}`;
}
