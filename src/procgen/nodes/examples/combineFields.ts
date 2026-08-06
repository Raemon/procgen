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
  inputs: {
    a: { kind: 'field', label: 'a' },
    b: { kind: 'field', label: 'b' },
  },
  params: {
    operation: { kind: 'select', label: 'operation', options: OPERATIONS, default: 'add' },
    clamp: { kind: 'boolean', label: 'clamp to 0..1', default: true },
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
