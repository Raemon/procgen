import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gatherFieldWindow, windowValueAt, type FieldWindow } from '../../values/fieldWindow';

registerNodeType({
  type: 'slopeField',
  title: 'slope',
  category: 'terrain',
  description:
    'Measures how steeply the source field falls away from each cell and returns that steepness as a field of its own.',
  whenToUse:
    'Anywhere the answer depends on steepness rather than height: bare rock and cliffs on the flanks of ranges, scree and snow that only cling to slopes, beaches only where the shore is flat, or as a mask that keeps detail noise off the plains.',
  inputs: {
    source: { kind: 'field', label: 'source', help: 'The elevation field to measure. Reads across chunk edges, so slopes stay continuous.' },
  },
  params: {
    radius: {
      kind: 'int',
      label: 'radius',
      help: 'How far apart the two samples are that define the slope. 1 catches cliff faces, larger values catch the overall grade of a mountainside.',
      min: 1,
      max: 16,
      default: 2,
    },
    gain: {
      kind: 'number',
      label: 'gain',
      help: 'Multiplier on the measured steepness before it is clamped to 0..1. Raise it until the slopes you care about read as bright.',
      min: 1,
      max: 200,
      step: 1,
      default: 40,
    },
  },
  output: 'field',
  generateChunk: slopeChunk,
});

function slopeChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const radius = ctx.params.radius as number;
  const window = gatherFieldWindow(ctx, 'source', radius + 1);
  if (!window) return fieldValue(out);
  const gain = ctx.params.gain as number;
  for (let i = 0; i < out.length; i++) {
    out[i] = steepnessAt(window, ctx.originX + (i % ctx.size), ctx.originY + Math.floor(i / ctx.size), radius, gain);
  }
  return fieldValue(out);
}

function steepnessAt(
  window: FieldWindow,
  worldX: number,
  worldY: number,
  radius: number,
  gain: number,
): number {
  const acrossX = windowValueAt(window, worldX + radius, worldY) - windowValueAt(window, worldX - radius, worldY);
  const acrossY = windowValueAt(window, worldX, worldY + radius) - windowValueAt(window, worldX, worldY - radius);
  return Math.min(1, (Math.hypot(acrossX, acrossY) / (2 * radius)) * gain);
}
