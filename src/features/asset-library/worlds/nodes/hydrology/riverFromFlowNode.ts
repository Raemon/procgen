import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import { gatherFieldWindow, windowValueAt, windowWorldX, windowWorldY, type FieldWindow } from '../../values/fieldWindow';

registerNodeType({
  type: 'riverFromFlow',
  title: 'rivers from flow',
  category: 'water',
  description:
    'Paints every cell whose drainage exceeds a threshold, widening the channel as the flow grows, so headwater threads converge into broad trunk rivers.',
  whenToUse:
    'Rivers drawn the way real drainage looks: dendritic, always merging downstream, never crossing a ridge, and wider near the mouth. Wire a flow accumulation node into it; the result feeds a river towns node unchanged.',
  inputs: {
    flow: { kind: 'field', expects: 'unit', label: 'flow', help: 'A flow accumulation field. Its value decides both whether a cell is a river and how wide the channel is.' },
    elevation: {
      kind: 'field',
      expects: 'elevation',
      label: 'elevation',
      help: 'Optional terrain used to keep channels out of the sea. Unwired means every high-flow cell is painted.',
      optional: true,
    },
  },
  params: {
    minFlow: {
      kind: 'number',
      label: 'river starts at',
      help: 'The flow value where a watercourse becomes visible. Lower values expose more of the branching network, up to every gully.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.55,
    },
    maxWidth: {
      kind: 'int',
      label: 'max width',
      help: 'Channel width in tiles at full flow. Headwaters stay one tile wide and grow toward this near the mouth.',
      min: 1,
      max: 12,
      default: 5,
    },
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'With elevation wired, cells below this are left to the ocean layer instead of being painted as river.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    riverTile: { kind: 'tile', label: 'river', help: 'Tile painted along the channel.' },
  },
  output: 'tiles',
  generateChunk: riverFromFlowChunk,
});

function riverFromFlowChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  const halo = Math.ceil((ctx.params.maxWidth as number) / 2) + 1;
  const flow = gatherFieldWindow(ctx, 'flow', halo);
  if (!flow) return tilesValue(tiles);
  const elevation = gatherFieldWindow(ctx, 'elevation', halo);
  for (let index = 0; index < flow.data.length; index++) {
    paintChannelAround(ctx, tiles, flow, elevation, index);
  }
  return tilesValue(tiles);
}

function paintChannelAround(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  flow: FieldWindow,
  elevation: FieldWindow | null,
  index: number,
): void {
  const radius = channelRadius(ctx, flow.data[index]!);
  if (radius < 0) return;
  const worldX = windowWorldX(flow, index);
  const worldY = windowWorldY(flow, index);
  if (isUnderSea(ctx, elevation, worldX, worldY)) return;
  paintDisc(ctx, tiles, worldX, worldY, radius);
}

function channelRadius(ctx: ChunkGenCtx, flow: number): number {
  const minFlow = ctx.params.minFlow as number;
  if (flow < minFlow) return -1;
  const strength = (flow - minFlow) / Math.max(1e-6, 1 - minFlow);
  return (strength * ((ctx.params.maxWidth as number) - 1)) / 2;
}

function isUnderSea(
  ctx: ChunkGenCtx,
  elevation: FieldWindow | null,
  worldX: number,
  worldY: number,
): boolean {
  return elevation !== null && windowValueAt(elevation, worldX, worldY) < (ctx.params.seaLevel as number);
}

function paintDisc(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  worldX: number,
  worldY: number,
  radius: number,
): void {
  const reach = Math.floor(radius);
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      if (Math.hypot(dx, dy) <= radius) paintCell(ctx, tiles, worldX + dx, worldY + dy);
    }
  }
}

function paintCell(ctx: ChunkGenCtx, tiles: TilesChunk, worldX: number, worldY: number): void {
  const localX = worldX - ctx.originX;
  const localY = worldY - ctx.originY;
  if (localX < 0 || localY < 0 || localX >= ctx.size || localY >= ctx.size) return;
  tiles[localY * ctx.size + localX] = ctx.params.riverTile as number;
}
