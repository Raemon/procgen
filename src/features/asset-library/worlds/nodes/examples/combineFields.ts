import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, newFieldChunk, type ChunkValue } from '../../values/chunkValues';

export const COMBINE_ADD = 0;
export const COMBINE_SUBTRACT = 1;
export const COMBINE_MULTIPLY = 2;
export const COMBINE_MIN = 3;
export const COMBINE_MAX = 4;
export const COMBINE_AVERAGE = 5;

const OPERATION_CHOICES = [
  { value: COMBINE_ADD, label: 'add', help: 'a + b. Raises a by b — stack bumps onto a base.' },
  { value: COMBINE_SUBTRACT, label: 'subtract', help: 'a − b. Carves b out of a.' },
  { value: COMBINE_MULTIPLY, label: 'multiply', help: 'a × b. Acts as masking: wherever b is 0, the result is 0.' },
  { value: COMBINE_MIN, label: 'min', help: 'Lower of the two. Intersection-like: keeps only what both fields allow.' },
  { value: COMBINE_MAX, label: 'max', help: 'Higher of the two. Union-like: merges the raised areas of both.' },
  { value: COMBINE_AVERAGE, label: 'average', help: '(a + b) / 2. A soft 50/50 blend.' },
] as const;

registerNodeType({
  type: 'combineFields',
  title: 'combine fields',
  category: 'basics',
  description: 'Cell-by-cell math on two upstream fields.',
  whenToUse:
    'Shaping terrain out of ingredients: multiply a noise by a mask to confine it, add bumps onto a base, or max two shapes together into one landmass.',
  inputs: {
    a: { kind: 'field', expects: 'unit', label: 'a', help: 'First operand — the field being shaped.' },
    b: { kind: 'field', expects: 'unit', label: 'b', help: 'Second operand — the field doing the shaping (mask, bumps, bias).' },
  },
  params: {
    operation: {
      kind: 'choice',
      label: 'operation',
      help: 'How each pair of cells is merged into one value.',
      options: OPERATION_CHOICES,
      default: COMBINE_ADD,
    },
    clamp: {
      kind: 'toggle',
      label: 'clamp to 0..1',
      help: 'Keep results inside 0..1 so downstream thresholds and elevation behave predictably.',
      default: 1,
    },
  },
  output: 'field',
  outputSemantic: 'unit',
  generateChunk: combineChunk,
});

function combineChunk(ctx: ChunkGenCtx): ChunkValue {
  const a = ctx.fieldInput('a') ?? newFieldChunk();
  const b = ctx.fieldInput('b') ?? newFieldChunk();
  const out = ctx.newField();
  const operation = ctx.params.operation as number;
  const clamp = ctx.params.clamp === 1;
  for (let i = 0; i < out.length; i++) out[i] = combined(operation, clamp, a[i]!, b[i]!);
  return fieldValue(out);
}

function combined(operation: number, clamp: boolean, a: number, b: number): number {
  const result = applyOperation(operation, a, b);
  return clamp ? Math.max(0, Math.min(1, result)) : result;
}

function applyOperation(operation: number, a: number, b: number): number {
  if (operation === COMBINE_ADD) return a + b;
  if (operation === COMBINE_SUBTRACT) return a - b;
  if (operation === COMBINE_MULTIPLY) return a * b;
  if (operation === COMBINE_MIN) return Math.min(a, b);
  if (operation === COMBINE_MAX) return Math.max(a, b);
  return (a + b) / 2;
}
