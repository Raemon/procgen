import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';

const LANDMARK_TAG = 'landmark';

registerNodeType({
  type: 'landmarkPoint',
  title: 'landmark point',
  category: 'landmark',
  description:
    'One point at exact world coordinates you type in, tagged "landmark". Every other points node scatters; this one puts a single thing in a place you chose.',
  whenToUse:
    'Anything that must be at a known spot rather than somewhere random: the torch in the starting room, a boss at the centre of the map, a gate a quest refers to.',
  inputs: {},
  params: {
    x: {
      kind: 'int',
      label: 'x',
      help: 'World x of the point, in tiles. The player starts near 0,0.',
      min: -4096,
      max: 4096,
      default: 0,
    },
    y: {
      kind: 'int',
      label: 'y',
      help: 'World y of the point, in tiles.',
      min: -4096,
      max: 4096,
      default: 0,
    },
  },
  output: 'points',
  generateChunk: landmarkChunk,
});

function landmarkChunk(ctx: ChunkGenCtx): ChunkValue {
  const x = ctx.params.x as number;
  const y = ctx.params.y as number;
  const points: PointsChunk = isInsideChunk(ctx, x, y) ? [{ x, y, tag: LANDMARK_TAG }] : [];
  return pointsValue(points);
}

function isInsideChunk(ctx: ChunkGenCtx, x: number, y: number): boolean {
  return (
    x >= ctx.originX && x < ctx.originX + ctx.size && y >= ctx.originY && y < ctx.originY + ctx.size
  );
}
