import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk, type WorldPoint } from '../../values/chunkValues';
import { BORN, CONE_HEIGHT, pointNumber } from '../../values/pointData';

const CURVE_LINEAR = 0;
const CURVE_EXPONENTIAL = 1;
const CURVE_LOGISTIC = 2;

const CURVE_CHOICES = [
  {
    value: CURVE_LINEAR,
    label: 'linear',
    help: 'Adds the rate once per span, for ever. A cone\'s footprint creeping outward as its flanks slump, a road widening with use.',
  },
  {
    value: CURVE_EXPONENTIAL,
    label: 'exponential',
    help: 'Multiplies by the rate once per span. With a rate of 0.5 the span is a half-life: the thing loses half of what it has left each time round. Erosion, decay, forgetting.',
  },
  {
    value: CURVE_LOGISTIC,
    label: 'logistic',
    help: 'An S: slow at first, quickest around one span old, then levelling off at the value it started with. Growth into a ceiling — a town filling its walls, a forest closing its canopy.',
  },
] as const;

registerNodeType({
  type: 'mapPointAttribute',
  title: 'age a point attribute',
  category: 'points',
  description:
    'Rewrites one number a point carries as a function of how old that point is right now, leaving every other attribute and the point itself alone. Cones lose height by half-lives, footprints creep outward year on year, settlements grow into their ceiling.',
  whenToUse:
    'Between anything that founds points with a birth date and anything that draws them, when what should change with time is a number rather than whether the point is there at all. It does not remove anything: put a "born by now" after it if the young ones should not exist yet.',
  readsTime: true,
  inputs: {
    source: {
      kind: 'points',
      requiresPointAttributes: [BORN],
      label: 'source',
      help: 'Points carrying a birth date. Points without one, and points not yet born, keep the value they came with.',
    },
  },
  params: {
    key: {
      kind: 'pointKey',
      label: 'attribute',
      help: 'Which attribute of the wired points is rewritten. Everything else the point carries passes through untouched.',
      from: 'source',
      default: CONE_HEIGHT,
    },
    curve: {
      kind: 'choice',
      label: 'curve',
      help: 'How the attribute answers to age.',
      options: CURVE_CHOICES,
      default: CURVE_EXPONENTIAL,
    },
    rate: {
      kind: 'number',
      label: 'rate',
      help: 'How much one span is worth: added per span for linear, multiplied per span for exponential, and the steepness of the middle of the S for logistic.',
      min: 0,
      max: 64,
      step: 0.01,
      default: 0.5,
    },
    perYears: {
      kind: 'number',
      label: 'span',
      help: 'How many years one turn of the curve takes — the half-life, the million years of slumping, the age at which growth is quickest.',
      min: 1_000,
      max: 5_000_000,
      step: 1_000,
      default: 1_000_000,
    },
  },
  output: 'points',
  generateChunk: mapAttributeChunk,
});

function mapAttributeChunk(ctx: ChunkGenCtx): ChunkValue {
  const source = ctx.pointsInput('source');
  if (!source) return pointsValue([]);
  const aged: PointsChunk = source.map((point) => agedPoint(ctx, point));
  return pointsValue(aged);
}

function agedPoint(ctx: ChunkGenCtx, point: WorldPoint): WorldPoint {
  const key = ctx.params.key as string;
  const age = Math.max(0, ctx.time - pointNumber(point, BORN, ctx.time));
  return {
    ...point,
    data: { ...point.data, [key]: curved(ctx, pointNumber(point, key, 0), age) },
  };
}

function curved(ctx: ChunkGenCtx, value: number, age: number): number {
  const rate = ctx.params.rate as number;
  const perYears = ctx.params.perYears as number;
  if (ctx.params.curve === CURVE_LINEAR) return value + (rate * age) / perYears;
  const spans = age / perYears;
  if (ctx.params.curve === CURVE_LOGISTIC) return value / (1 + Math.exp(-rate * (spans - 1)));
  return value * Math.pow(rate, spans);
}
