import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, newFieldChunk, type ChunkValue } from '../../values/chunkValues';

const OPERATIONS = ['add', 'subtract', 'multiply', 'min', 'max', 'average'] as const;

type Operation = (typeof OPERATIONS)[number];

registerNodeType({
  type: 'combineFields',
  title: 'combine fields',
  category: 'examples',
  description: 'Cell-by-cell math on two upstream fields.',
  whenToUse:
    'Shaping terrain out of ingredients: multiply a noise by a mask to confine it, add bumps onto a base, or max two shapes together into one landmass.',
  inputs: {
    a: { kind: 'field', label: 'a', help: 'First operand — the field being shaped.' },
    b: { kind: 'field', label: 'b', help: 'Second operand — the field doing the shaping (mask, bumps, bias).' },
  },
  params: {
    operation: {
      kind: 'select',
      label: 'operation',
      help: 'How each pair of cells is merged into one value.',
      options: OPERATIONS,
      optionHelp: {
        add: 'a + b. Raises a by b — stack bumps onto a base.',
        subtract: 'a − b. Carves b out of a.',
        multiply: 'a × b. Acts as masking: wherever b is 0, the result is 0.',
        min: 'Lower of the two. Intersection-like: keeps only what both fields allow.',
        max: 'Higher of the two. Union-like: merges the raised areas of both.',
        average: '(a + b) / 2. A soft 50/50 blend.',
      },
      default: 'add',
    },
    clamp: {
      kind: 'boolean',
      label: 'clamp to 0..1',
      help: 'Keep results inside 0..1 so downstream thresholds and elevation behave predictably.',
      default: true,
    },
  },
  output: 'field',
  generateChunk: combineChunk,
});

function combineChunk(ctx: ChunkGenCtx): ChunkValue {
  const a = ctx.fieldInput('a') ?? newFieldChunk();
  const b = ctx.fieldInput('b') ?? newFieldChunk();
  const out = ctx.newField();
  const operation = ctx.params.operation as Operation;
  const clamp = ctx.params.clamp as boolean;
  for (let i = 0; i < out.length; i++) out[i] = combined(operation, clamp, a[i]!, b[i]!);
  return fieldValue(out);
}

function combined(operation: Operation, clamp: boolean, a: number, b: number): number {
  const result = applyOperation(operation, a, b);
  return clamp ? Math.max(0, Math.min(1, result)) : result;
}

function applyOperation(operation: Operation, a: number, b: number): number {
  if (operation === 'add') return a + b;
  if (operation === 'subtract') return a - b;
  if (operation === 'multiply') return a * b;
  if (operation === 'min') return Math.min(a, b);
  if (operation === 'max') return Math.max(a, b);
  return (a + b) / 2;
}
