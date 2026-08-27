import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gatherFieldWindow } from '../../values/fieldWindow';
import { channelStrengths, deepestCutAt, taperWeights, type ValleyCutSpec } from './valleyCut';

registerNodeType({
  type: 'carveValleys',
  title: 'carve valleys',
  category: 'water',
  description:
    'Lowers the terrain around every watercourse in proportion to how much water it carries, tapering out sideways so channels sit in valleys instead of on top of the ground.',
  whenToUse:
    'After flow accumulation, to get the shape erosion leaves behind: V-shaped headwater notches, broad floodplains along the trunks, and ridges that read as ridges because the ground between rivers is what stayed high.',
  inputs: {
    elevation: { kind: 'field', expects: 'elevation', label: 'elevation', help: 'The terrain to erode.' },
    flow: { kind: 'field', expects: 'unit', label: 'flow', help: 'A flow accumulation field over the same terrain. Where it is high, the cut is deep and wide.' },
  },
  params: {
    depth: {
      kind: 'number',
      label: 'depth',
      help: 'How far a full-flow river cuts below the surrounding ground.',
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.08,
    },
    minFlow: {
      kind: 'number',
      label: 'carve above flow',
      help: 'Flow below this leaves no mark, so only real watercourses erode and the hillsides stay intact.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.4,
    },
    valleyWidth: {
      kind: 'int',
      label: 'valley width',
      help: 'How far the cut spreads sideways from the channel, in tiles. Narrow is a canyon, wide is a river plain.',
      min: 1,
      max: 24,
      default: 6,
    },
  },
  output: 'field',
  outputSemantic: 'elevation',
  generateChunk: carveValleysChunk,
});

function carveValleysChunk(ctx: ChunkGenCtx): ChunkValue {
  const elevation = ctx.fieldInput('elevation');
  const spec = cutSpecOf(ctx);
  const out = ctx.newField();
  const flow = gatherFieldWindow(ctx, 'flow', spec.valleyWidth + 1);
  if (!elevation || !flow) return fieldValue(out);
  const strengths = channelStrengths(flow, spec.minFlow);
  const weights = taperWeights(spec.valleyWidth);
  for (let i = 0; i < out.length; i++) {
    const worldX = ctx.originX + (i % ctx.size);
    const worldY = ctx.originY + Math.floor(i / ctx.size);
    out[i] = Math.max(0, elevation[i]! - deepestCutAt(strengths, flow, weights, spec, worldX, worldY));
  }
  return fieldValue(out);
}

function cutSpecOf(ctx: ChunkGenCtx): ValleyCutSpec {
  return {
    depth: ctx.params.depth as number,
    minFlow: ctx.params.minFlow as number,
    valleyWidth: Math.max(1, Math.round(ctx.params.valleyWidth as number)),
  };
}
