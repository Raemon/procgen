import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'blendFields',
  title: 'blend fields',
  category: 'terrain',
  description:
    'Mixes two fields by a weight, optionally steered cell by cell by a third field so the mix changes across the world.',
  whenToUse:
    'Adding detail to a big shape without drowning it: blend a little ridged noise into plate uplift. With a mask wired, the same node makes noise appear only where the mask says — jagged peaks on the ranges, smooth plains everywhere else.',
  inputs: {
    a: { kind: 'field', label: 'a', help: 'The field you get at weight 0 — usually the large-scale shape.' },
    b: { kind: 'field', label: 'b', help: 'The field you get at weight 1 — usually the detail being mixed in.' },
    mask: {
      kind: 'field',
      expects: 'mask',
      label: 'mask',
      help: 'Optional per-cell multiplier on the weight, so b only shows where the mask is high. Unwired means blend evenly everywhere.',
      optional: true,
    },
  },
  params: {
    weight: {
      kind: 'number',
      label: 'weight of b',
      help: 'How much of b to mix into a. 0.15 keeps a in charge and lets b add texture.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.25,
    },
  },
  output: 'field',
  outputSemantic: 'raw',
  generateChunk: blendChunk,
});

function blendChunk(ctx: ChunkGenCtx): ChunkValue {
  const a = ctx.fieldInput('a');
  const b = ctx.fieldInput('b');
  const mask = ctx.fieldInput('mask');
  const out = ctx.newField();
  if (!a || !b) return fieldValue(out);
  const weight = ctx.params.weight as number;
  for (let i = 0; i < out.length; i++) out[i] = mixed(a[i]!, b[i]!, weight * (mask?.[i] ?? 1));
  return fieldValue(out);
}

function mixed(a: number, b: number, weight: number): number {
  return Math.max(0, Math.min(1, a + (b - a) * weight));
}
