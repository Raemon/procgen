import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { BORN, pointNumber } from '../../values/pointData';

export const BORN_FILTER_TYPE = 'bornFilter';

registerNodeType({
  type: BORN_FILTER_TYPE,
  title: 'born by now',
  category: 'time',
  readsTime: true,
  description:
    'Keeps only the points already born at the moment the world is being shown, reading the birth date every producer writes into its points.',
  whenToUse:
    'Between anything that founds things over time and whatever draws them. Scrubbing world time backwards then takes the young ones away and leaves the old standing.',
  inputs: {
    source: {
      kind: 'points',
      requiresPointAttributes: [BORN],
      label: 'source',
      help: 'Points carrying a birth date. Points without one are treated as having always been here.',
    },
  },
  params: {},
  output: 'points',
  generateChunk: bornFilterChunk,
});

function bornFilterChunk(ctx: ChunkGenCtx): ChunkValue {
  const source = ctx.pointsInput('source');
  if (!source) return pointsValue([]);
  const born: PointsChunk = source.filter((point) => pointNumber(point, BORN, -Infinity) <= ctx.time);
  return pointsValue(born);
}
