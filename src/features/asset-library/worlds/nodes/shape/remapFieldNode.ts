import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import {
  PROFILE_CHOICES,
  PROFILE_RAMP,
  PROFILE_STEPS,
  profileValueAt,
  type FieldProfile,
} from '../../shape/fieldProfile';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'remapField',
  title: 'remap field',
  category: 'shape',
  description:
    'Runs every cell of a field through one curve and writes the answer between a low and a high value. The curve can be a ramp, a hump, a ring of two rims, a repeating sawtooth, or a stair of flat levels.',
  whenToUse:
    'The general knob-turner for a field that is nearly right. Ramp a noise into a mask that only opens above a value, bell a distance field into a halo that fades both ways from a contour, sawtooth an elevation into strata, or step it into bands before a biome node reads it. Fixed curves like the hypsometric one still say what they mean better; reach for this when none of them is the shape you want.',
  inputs: {
    source: { kind: 'field', expects: 'unit', label: 'source', help: 'The field to reshape. Read cell by cell, so the result stays exactly as smooth as the source.' },
  },
  params: {
    mode: {
      kind: 'choice',
      label: 'curve',
      help: 'The shape the curve makes between low and high.',
      options: PROFILE_CHOICES,
      default: PROFILE_RAMP,
    },
    center: {
      kind: 'number',
      label: 'centre',
      help: 'The source value the curve is built around: the middle of the ramp, the peak of the bell, the hollow inside the ring, the start of each sawtooth.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    width: {
      kind: 'number',
      label: 'width',
      help: 'How much of the source range the curve spans. Narrow widths give a hard switch, wide ones a long fade; for the sawtooth it is the period.',
      min: 0.01,
      max: 1,
      step: 0.01,
      default: 0.4,
    },
    low: {
      kind: 'number',
      label: 'low',
      help: 'What the curve writes where it reads 0.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
    },
    high: {
      kind: 'number',
      label: 'high',
      help: 'What the curve writes where it reads 1.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 1,
    },
    invert: {
      kind: 'toggle',
      label: 'invert',
      help: 'Flips the curve before low and high are applied, so a hump becomes a dip and a rise becomes a fall.',
      default: 0,
    },
    levels: {
      kind: 'int',
      label: 'levels',
      help: 'How many flat levels the stair has, counting both ends.',
      min: 2,
      max: 16,
      default: 4,
      visibleWhen: { param: 'mode', equals: PROFILE_STEPS },
    },
  },
  output: 'field',
  outputSemantic: 'unit',
  generateChunk: remapChunk,
});

function remapChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const source = ctx.fieldInput('source');
  if (!source) return fieldValue(out);
  const profile = profileOf(ctx);
  const low = ctx.params.low as number;
  const high = ctx.params.high as number;
  for (let i = 0; i < out.length; i++) {
    out[i] = low + (high - low) * profileValueAt(source[i]!, profile);
  }
  return fieldValue(out);
}

function profileOf(ctx: ChunkGenCtx): FieldProfile {
  return {
    shape: ctx.params.mode as number,
    center: ctx.params.center as number,
    width: ctx.params.width as number,
    levels: ctx.params.levels as number,
    invert: ctx.params.invert === 1,
  };
}
