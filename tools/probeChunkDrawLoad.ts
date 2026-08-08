import '../procgen/nodes';
import { emberMarches } from '../procgen/presets/emberMarches';
import { puzzleLabyrinth } from '../procgen/presets/puzzleLabyrinth';
import { buildChunkMeshGroup } from '../world/render/view3d/worldMeshes';
import { drawLoadLine, drawLoadOf } from './chunkDrawLoad';
import { worldFromPipelineState, type HeadlessWorld } from './headlessWorld';
import { stubTheCanvasTexturesAreRasterizedOnto } from './stubCanvasForHeadlessTextures';
import type { PipelineState } from '../procgen/pipeline/pipelineState';

const OPEN_SKY_CHUNKS = [
  [0, 0],
  [10, 4],
] as const;
const DELVE_CHUNKS = [
  [0, 0],
  [3, 2],
] as const;

stubTheCanvasTexturesAreRasterizedOnto();

reportChunks('above ground in the ember marches', emberMarches().state, OPEN_SKY_CHUNKS);
reportChunks('inside the delve of the puzzle labyrinth', puzzleLabyrinth().state, DELVE_CHUNKS);

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
