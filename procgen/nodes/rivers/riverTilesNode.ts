import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import { worldFieldReader } from '../../values/worldInputReaders';
import { riverSourcesInRect } from './riverSources';
import { traceRiverDownhill, type RiverCell } from './traceRiverDownhill';

registerNodeType({
  type: 'riverTiles',
  title: 'rivers',
  category: 'water',
  description:
    'Traces rivers downhill across an elevation field: springs appear on high ground and each river follows the steepest descent, meandering a little, until it reaches the sea.',
  whenToUse:
    'Water that follows the terrain instead of being painted by hand. Wire the same elevation field that shapes your land, then feed the result into a river towns node to settle the mouths and crossings.',
  inputs: {
    elevation: {
      kind: 'field',
      label: 'elevation',
      help: 'The terrain rivers flow down. Use the same field that drives your land tiles so rivers agree with the coastline.',
    },
  },
  params: {
    sourceDensity: {
      kind: 'number',
      label: 'source density',
      help: 'Chance per cell of a spring appearing on eligible high ground. Higher means more rivers.',
      min: 0,
      max: 0.02,
      step: 0.0005,
      default: 0.003,
    },
    minSourceHeight: {
      kind: 'number',
      label: 'spring height ≥',
      help: 'Springs only appear where elevation is at least this, so rivers start in the hills.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.62,
    },
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Rivers stop when the terrain drops below this. Match the threshold your ocean layer uses.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
    maxLength: {
      kind: 'int',
      label: 'max length',
      help: 'Longest river in tiles. Longer rivers cost more to generate because each chunk considers springs this far away.',
      min: 8,
      max: 192,
      default: 80,
    },
    meander: {
      kind: 'number',
      label: 'meander',
      help: 'How much rivers wander off the steepest path. 0 is strictly steepest-descent; higher values snake more.',
      min: 0,
      max: 0.2,
      step: 0.005,
      default: 0.04,
    },
    riverTile: { kind: 'tile', label: 'river', help: 'Tile painted along every river course.' },
  },
  output: 'tiles',
  generateChunk: riverTilesChunk,
});

function riverTilesChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  if (!ctx.fieldInput('elevation')) return tilesValue(tiles);
  for (const river of riversTouchingChunk(ctx)) paintRiverCells(ctx, tiles, river);
  return tilesValue(tiles);
}

function riversTouchingChunk(ctx: ChunkGenCtx): RiverCell[][] {
  const elevationAt = worldFieldReader(ctx, 'elevation');
  const traceSpec = {
    seaLevel: ctx.params.seaLevel as number,
    maxLength: ctx.params.maxLength as number,
    meander: ctx.params.meander as number,
  };
  const sources = sourcesNearChunk(ctx, elevationAt, traceSpec.maxLength);
  return sources.map((source) => traceRiverDownhill(elevationAt, ctx.hash01, traceSpec, source.x, source.y));
}

function sourcesNearChunk(
  ctx: ChunkGenCtx,
  elevationAt: ReturnType<typeof worldFieldReader>,
  maxLength: number,
): RiverCell[] {
  const halo = Math.ceil(maxLength / ctx.size) * ctx.size;
  return riverSourcesInRect(
    elevationAt,
    ctx.hash01,
    {
      sourceDensity: ctx.params.sourceDensity as number,
      minSourceHeight: ctx.params.minSourceHeight as number,
    },
    ctx.originX - halo,
    ctx.originY - halo,
    ctx.originX + ctx.size - 1 + halo,
    ctx.originY + ctx.size - 1 + halo,
  );
}

function paintRiverCells(ctx: ChunkGenCtx, tiles: TilesChunk, river: RiverCell[]): void {
  for (const cell of river) {
    const localX = cell.x - ctx.originX;
    const localY = cell.y - ctx.originY;
    if (localX < 0 || localX >= ctx.size || localY < 0 || localY >= ctx.size) continue;
    tiles[localY * ctx.size + localX] = ctx.params.riverTile as number;
  }
}
