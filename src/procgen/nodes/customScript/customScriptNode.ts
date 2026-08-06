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
  whenToUse:
    'Experiments the built-in nodes cannot express. Iterate in the browser; when a script stabilizes, promote it to a TypeScript node file (see docs/authoring-nodes.md).',
  inputs: {
    a: {
      kind: 'any',
      label: 'a',
      help: "Optional upstream value of any kind, read in code via ctx.input('a') or the typed ctx.fieldInput / tilesInput / pointsInput.",
      optional: true,
    },
    b: {
      kind: 'any',
      label: 'b',
      help: "Optional second upstream value, read in code via ctx.input('b').",
      optional: true,
    },
  },
  params: {
    outputKind: {
      kind: 'select',
      label: 'output',
      help: 'What the script must return; this also decides how the node can display and what it can wire into.',
      options: OUTPUT_KINDS,
      optionHelp: {
        field: 'One number per cell (Float32Array via ctx.newField()). Displays as elevation.',
        tiles: 'One tile id per cell, -1 for empty (Int32Array via ctx.newTiles()). Displays as a tile layer.',
        points: 'A list of {x, y, tag} in world coordinates. Displays as markers.',
      },
      default: 'field',
    },
    code: {
      kind: 'code',
      label: 'code',
      help: 'The body of generateChunk(ctx). Use ctx.rng / ctx.hash01 for randomness so the world stays deterministic. Apply with the button or Ctrl+Enter.',
      default: SCRIPT_TEMPLATE,
    },
  },
  output: (params) => params.outputKind as ValueKind,
  generateChunk: runScriptChunk,
});

function runScriptChunk(ctx: ChunkGenCtx): ChunkValue {
  const run = compileScript(ctx.params.code as string);
  return coerceScriptResult(run(ctx), ctx.params.outputKind as ValueKind);
}
