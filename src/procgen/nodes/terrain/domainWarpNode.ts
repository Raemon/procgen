import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gatherFieldWindow, windowValueAt, type FieldWindow } from '../../values/fieldWindow';

registerNodeType({
  type: 'domainWarp',
  title: 'domain warp',
  category: 'terrain',
  description:
    'Reads the source field at a position pushed around by two other fields, so straight features bend and stretch instead of staying where they were generated.',
  whenToUse:
    'The cheapest way to stop terrain looking machine-made. Warping plate uplift bends polygonal plate edges into believable coastlines; warping noise turns round blobs into folded, sinuous relief.',
  inputs: {
    source: {
      kind: 'field',
      label: 'source',
      help: 'The field being displaced. Its values are unchanged — only the position they are read from moves.',
    },
    offsetX: {
      kind: 'field',
      label: 'offset x',
      help: 'Drives horizontal displacement: 0.5 means no shift, 0 and 1 shift by the full strength each way. Use a low-frequency noise field.',
    },
    offsetY: {
      kind: 'field',
      label: 'offset y',
      help: 'Same for vertical displacement. Leave unwired to warp along one axis only.',
      optional: true,
    },
  },
  params: {
    strength: {
      kind: 'number',
      label: 'strength',
      help: 'Largest displacement in tiles. Large values need a large read window, so they cost more per chunk.',
      min: 0,
      max: 128,
      step: 1,
      default: 24,
    },
  },
  output: 'field',
  generateChunk: domainWarpChunk,
});

function domainWarpChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const strength = ctx.params.strength as number;
  const source = gatherFieldWindow(ctx, 'source', Math.ceil(strength) + 1);
  const offsetX = ctx.fieldInput('offsetX');
  const offsetY = ctx.fieldInput('offsetY');
  if (!source || !offsetX) return fieldValue(out);
  for (let i = 0; i < out.length; i++) {
    out[i] = warpedSample(ctx, source, strength, i, offsetX[i]!, offsetY?.[i] ?? 0.5);
  }
  return fieldValue(out);
}

function warpedSample(
  ctx: ChunkGenCtx,
  source: FieldWindow,
  strength: number,
  index: number,
  offsetX: number,
  offsetY: number,
): number {
  const worldX = ctx.originX + (index % ctx.size) + (offsetX - 0.5) * 2 * strength;
  const worldY = ctx.originY + Math.floor(index / ctx.size) + (offsetY - 0.5) * 2 * strength;
  return bilinearWindowSample(source, worldX, worldY);
}

function bilinearWindowSample(window: FieldWindow, x: number, y: number): number {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const top = lerp(windowValueAt(window, cellX, cellY), windowValueAt(window, cellX + 1, cellY), x - cellX);
  const bottom = lerp(
    windowValueAt(window, cellX, cellY + 1),
    windowValueAt(window, cellX + 1, cellY + 1),
    x - cellX,
  );
  return lerp(top, bottom, y - cellY);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
