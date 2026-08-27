import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';
import { gatherFieldWindow, windowValueAt, type FieldWindow } from '../../values/fieldWindow';

const SPAN_HALO = 2;

registerNodeType({
  type: 'straitBridges',
  title: 'strait bridges',
  category: 'water',
  description:
    'Spans narrow shallow water with straight bridges wherever two shores face each other across no more than a few tiles, on a jittered lattice of crossing lines so island chains knit into a walkable network without every strait being paved.',
  whenToUse:
    'The cure for beautiful archipelagos nobody can explore. Wire in the same field your ocean layer thresholds and match sea level; deep water stays impassable, but shallow straits gain the occasional crossing — a chokepoint the walker can see from afar and aim for.',
  inputs: {
    water: {
      kind: 'field',
      expects: 'elevation',
      label: 'water',
      help: 'The field that decides where water is — usually the same terrain your sea layer reads. Cells at or below sea level count as water.',
    },
  },
  params: {
    waterBelow: {
      kind: 'number',
      label: 'sea level',
      help: 'Cells at or below this are water. Match the threshold your ocean tiles use.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
    shallowBand: {
      kind: 'number',
      label: 'shallow band',
      help: 'How far below sea level a strait may drop and still carry a bridge. Deep channels stay unspanned, so big water keeps dividing the map.',
      min: 0.02,
      max: 0.5,
      step: 0.01,
      default: 0.15,
    },
    maxSpan: {
      kind: 'int',
      label: 'longest span',
      help: 'The widest water gap a bridge may cross, in tiles.',
      min: 2,
      max: 24,
      default: 10,
    },
    pitch: {
      kind: 'int',
      label: 'crossing pitch',
      help: 'Spacing of the candidate crossing lines, in tiles. Smaller pitch means more bridges.',
      min: 12,
      max: 96,
      default: 32,
    },
    bridgeTile: { kind: 'tile', label: 'bridge', help: 'Tile paved along each span. Pick something walkable.' },
  },
  output: 'tiles',
  generateChunk: straitBridgesChunk,
});

function straitBridgesChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  const maxSpan = Math.round(ctx.params.maxSpan as number);
  const window = gatherFieldWindow(ctx, 'water', maxSpan + SPAN_HALO);
  if (!window) return tilesValue(tiles);
  paintCrossings(ctx, tiles, window, 'row');
  paintCrossings(ctx, tiles, window, 'column');
  return tilesValue(tiles);
}

function paintCrossings(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  window: FieldWindow,
  direction: 'row' | 'column',
): void {
  const pitch = Math.max(12, Math.round(ctx.params.pitch as number));
  const origin = direction === 'row' ? ctx.originY : ctx.originX;
  for (let along = 0; along < ctx.size; along++) {
    const line = origin + along;
    if (!isCrossingLine(ctx, line, pitch, direction)) continue;
    paintSpansOnLine(ctx, tiles, window, direction, line);
  }
}

function isCrossingLine(
  ctx: ChunkGenCtx,
  line: number,
  pitch: number,
  direction: 'row' | 'column',
): boolean {
  const cell = Math.floor(line / pitch);
  const jitter = Math.floor(ctx.hash01(cell, direction === 'row' ? 1 : 2, 'bridge-line') * (pitch / 2));
  return line === cell * pitch + jitter;
}

function paintSpansOnLine(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  window: FieldWindow,
  direction: 'row' | 'column',
  line: number,
): void {
  const maxSpan = Math.round(ctx.params.maxSpan as number);
  const from = (direction === 'row' ? ctx.originX : ctx.originY) - maxSpan - 1;
  const to = (direction === 'row' ? ctx.originX : ctx.originY) + ctx.size + maxSpan + 1;
  let runStart: number | null = null;
  let runIsBridgeable = true;
  for (let at = from; at <= to; at++) {
    const value = valueOn(window, direction, line, at);
    if (isWater(ctx, value)) {
      if (runStart === null) {
        runStart = at;
        runIsBridgeable = true;
      }
      if (!isShallow(ctx, value)) runIsBridgeable = false;
      continue;
    }
    if (runStart !== null && runIsBridgeable && at - runStart <= maxSpan && runStart > from) {
      paintSpan(ctx, tiles, direction, line, runStart, at - 1);
    }
    runStart = null;
  }
}

function valueOn(
  window: FieldWindow,
  direction: 'row' | 'column',
  line: number,
  at: number,
): number {
  return direction === 'row' ? windowValueAt(window, at, line) : windowValueAt(window, line, at);
}

function isWater(ctx: ChunkGenCtx, value: number): boolean {
  return value <= (ctx.params.waterBelow as number);
}

function isShallow(ctx: ChunkGenCtx, value: number): boolean {
  return value >= (ctx.params.waterBelow as number) - (ctx.params.shallowBand as number);
}

function paintSpan(
  ctx: ChunkGenCtx,
  tiles: TilesChunk,
  direction: 'row' | 'column',
  line: number,
  from: number,
  to: number,
): void {
  const bridgeTile = ctx.params.bridgeTile as number;
  if (bridgeTile < 0) return;
  for (let at = from; at <= to; at++) {
    const worldX = direction === 'row' ? at : line;
    const worldY = direction === 'row' ? line : at;
    const x = worldX - ctx.originX;
    const y = worldY - ctx.originY;
    if (x < 0 || x >= ctx.size || y < 0 || y >= ctx.size) continue;
    tiles[y * ctx.size + x] = bridgeTile;
  }
}
