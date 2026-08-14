import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'terraceField',
  title: 'terrace field',
  category: 'terrain',
  description:
    'Snaps a field to a small number of flat levels, so smooth slopes become stacked plateaus separated by sharp risers — and where the optional passes field runs high, the smooth slope is kept, leaving climbable ramps through the cliffs.',
  whenToUse:
    'The way to make elevation gate movement. Bind the result to an elevation display and every riser taller than a step becomes a wall; wire a coarse noise into passes and the walls break into ridges with a few ways up, which is what turns terrain into a route choice.',
  inputs: {
    source: { kind: 'field', label: 'source', help: 'The field to terrace, usually terrain.' },
    passes: {
      kind: 'field',
      label: 'passes',
      help: 'Optional field marking where ramps cut through. Where it exceeds the pass threshold, the source is kept smooth instead of stepped.',
      optional: true,
    },
  },
  params: {
    levels: {
      kind: 'int',
      label: 'levels',
      help: 'How many flat plateaus the field is snapped to. Fewer levels mean taller risers between them.',
      min: 2,
      max: 12,
      default: 4,
    },
    passesAbove: {
      kind: 'number',
      label: 'passes above',
      help: 'The passes value where a ramp opens. Lower values carve more ways through the cliffs.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.65,
    },
  },
  output: 'field',
  generateChunk: terraceChunk,
});

function terraceChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const source = ctx.fieldInput('source');
  if (!source) return fieldValue(out);
  const passes = ctx.fieldInput('passes');
  const levels = Math.max(2, Math.round(ctx.params.levels as number));
  const passesAbove = ctx.params.passesAbove as number;
  for (let i = 0; i < out.length; i++) {
    const value = source[i]!;
    const onPass = passes !== null && passes[i]! >= passesAbove;
    out[i] = onPass ? value : Math.round(value * levels) / levels;
  }
  return fieldValue(out);
}
