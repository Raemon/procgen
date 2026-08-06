import { fractalNoise } from '../../../noise/fractalNoise';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'noiseField',
  title: 'noise field',
  category: 'examples',
  description: 'Seeded fractal value noise sampled at world position, so chunks always line up.',
  inputs: {},
  params: {
    scale: { kind: 'number', label: 'scale', min: 0.005, max: 0.3, step: 0.005, default: 0.06 },
    octaves: { kind: 'int', label: 'octaves', min: 1, max: 8, default: 4 },
  },
  output: 'field',
  generateChunk: noiseChunk,
});

function noiseChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const seed = ctx.hashSeed('noise');
  const scale = ctx.params.scale as number;
  const octaves = ctx.params.octaves as number;
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      field[y * ctx.size + x] = fractalNoise(
        (ctx.originX + x) * scale,
        (ctx.originY + y) * scale,
        seed,
        octaves,
      );
    }
  }
  return fieldValue(field);
}
