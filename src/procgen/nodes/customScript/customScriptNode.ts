import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import type { ChunkValue, ValueKind } from '../../values/chunkValues';
import { coerceScriptResult } from './coerceScriptResult';
import { compileScript } from './compileScript';
import { SCRIPT_TEMPLATE } from './scriptTemplate';

const OUTPUT_KINDS = ['field', 'tiles', 'points'] as const;

registerNodeType({
  type: 'customScript',
  title: 'custom script',
  category: 'custom',
  description: 'Write generateChunk(ctx) right here in the browser. Return a field array, tile array, or point list matching the chosen output.',
  inputs: {
    a: { kind: 'any', label: 'a', optional: true },
    b: { kind: 'any', label: 'b', optional: true },
  },
  params: {
    outputKind: { kind: 'select', label: 'output', options: OUTPUT_KINDS, default: 'field' },
    code: { kind: 'code', label: 'code', default: SCRIPT_TEMPLATE },
  },
  output: (params) => params.outputKind as ValueKind,
  generateChunk: runScriptChunk,
});

function runScriptChunk(ctx: ChunkGenCtx): ChunkValue {
  const run = compileScript(ctx.params.code as string);
  return coerceScriptResult(run(ctx), ctx.params.outputKind as ValueKind);
}
