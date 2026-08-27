import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gradientAcross } from '../../values/fieldGradient';
import { gatherFieldWindow } from '../../values/fieldWindow';

const TAU = Math.PI * 2;

registerNodeType({
  type: 'gradientDirection',
  title: 'gradient direction',
  category: 'terrain',
  description:
    'Reports which way the source field climbs, as a turn fraction: 0.5 where the ground rises toward +x, 0.75 toward +y, 0 and 1 toward -x, 0.25 toward -y. Flat ground reads 0.5, having no direction to report.',
  whenToUse:
    'Anywhere the answer should depend on which way a slope faces rather than how steep it is: sunlit and shaded flanks of a range, snow that only survives on one aspect, dune crests combed by one wind, or as the angle a downstream node aligns its grain to. Pair it with slope, which measures the same difference and throws the direction away.',
  inputs: {
    source: { kind: 'field', expects: 'elevation', label: 'source', help: 'The field whose uphill direction is measured. Read across chunk edges, so the direction stays continuous.' },
  },
  params: {
    radius: {
      kind: 'int',
      label: 'radius',
      help: 'How far apart the two samples are that define the direction. 1 follows every wrinkle, larger values give the direction of the whole hillside.',
      min: 1,
      max: 16,
      default: 2,
    },
  },
  output: 'field',
  outputSemantic: 'unit',
  generateChunk: gradientDirectionChunk,
});

function gradientDirectionChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const radiusCells = Math.max(1, Math.round(ctx.params.radius as number));
  const window = gatherFieldWindow(ctx, 'source', radiusCells + 1);
  if (!window) return fieldValue(out);
  for (let i = 0; i < out.length; i++) {
    const cellX = ctx.originX + (i % ctx.size);
    const cellY = ctx.originY + Math.floor(i / ctx.size);
    const { acrossX, acrossY } = gradientAcross(window, cellX, cellY, radiusCells);
    out[i] = Math.atan2(acrossY, acrossX) / TAU + 0.5;
  }
  return fieldValue(out);
}
