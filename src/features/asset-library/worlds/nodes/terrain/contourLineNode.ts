import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gatherFieldWindow, windowValueAt, type FieldWindow } from '../../values/fieldWindow';

registerNodeType({
  type: 'contourLine',
  title: 'contour line',
  category: 'terrain',
  description:
    'Marks the cells sitting just below one height in a field: 1 on the low side of the contour, 0 everywhere else, so a smooth field yields thin winding lines that close into loops.',
  whenToUse:
    'Thin linear features that follow a field rather than a grid. Scale it and subtract it from elevation and crevasses wind across the land a jump wide; threshold the same lines to paint the crack floors; run it on a coast distance for a surf line hugging every shore.',
  inputs: {
    source: {
      kind: 'field',
      label: 'source',
      help: 'The field whose contour is traced — a coarse noise gives long wandering lines.',
    },
  },
  params: {
    level: {
      kind: 'number',
      label: 'level',
      help: 'The height being traced. Cells below it that touch a cell at or above it are the line.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    width: {
      kind: 'int',
      label: 'width',
      help: 'How many tiles below the contour count as on the line. 1 is a single-tile line a jump can clear.',
      min: 1,
      max: 4,
      default: 1,
    },
  },
  output: 'field',
  generateChunk: contourChunk,
});

function contourChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const width = ctx.params.width as number;
  const window = gatherFieldWindow(ctx, 'source', width);
  if (!window) return fieldValue(out);
  const level = ctx.params.level as number;
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const worldX = ctx.originX + x;
      const worldY = ctx.originY + y;
      if (windowValueAt(window, worldX, worldY) >= level) continue;
      if (touchesLevel(window, worldX, worldY, level, width)) out[y * ctx.size + x] = 1;
    }
  }
  return fieldValue(out);
}

function touchesLevel(
  window: FieldWindow,
  worldX: number,
  worldY: number,
  level: number,
  width: number,
): boolean {
  for (let dy = -width; dy <= width; dy++) {
    for (let dx = -width; dx <= width; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) + Math.abs(dy) > width) continue;
      if (windowValueAt(window, worldX + dx, worldY + dy) >= level) return true;
    }
  }
  return false;
}
