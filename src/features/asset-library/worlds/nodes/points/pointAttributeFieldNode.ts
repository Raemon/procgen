import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx, ParamValue } from '../../nodeType';
import { PROFILE_RIM, STAMP_PROFILE_CHOICES, stampValueAt, type StampProfile } from '../../shape/pointStamp';
import { fieldValue, type ChunkValue, type WorldPoint } from '../../values/chunkValues';
import { nearbyPoints } from '../../values/nearbyPoints';
import { BORN, CONE_HEIGHT, CONE_RADIUS, pointNumber } from '../../values/pointData';
import { FROM_ATTRIBUTE, FROM_KNOB, sourceChoices } from './pointSourceChoice';

const REDUCE_MIN = 0;
const REDUCE_MAX = 1;
const REDUCE_SUM = 2;
const REDUCE_MEAN = 3;
const REDUCE_NEAREST = 4;

const REDUCE_CHOICES = [
  { value: REDUCE_MIN, label: 'min', help: 'The smallest reading of every point covering the cell — the earliest date, the shallowest depth.' },
  { value: REDUCE_MAX, label: 'max', help: 'The largest reading — the latest date, the richest seam.' },
  { value: REDUCE_SUM, label: 'sum', help: 'Every covering point added together, so a crowd reads higher than a loner.' },
  { value: REDUCE_MEAN, label: 'mean', help: 'The average of every covering point, so a crowd reads like its typical member rather than its size.' },
  { value: REDUCE_NEAREST, label: 'nearest', help: 'The reading of the single closest point, so the field breaks into territories with hard edges between them.' },
] as const;

const WITHIN_DISC = 0;
const WITHIN_PROFILE_ABOVE = 1;

const WITHIN_CHOICES = [
  { value: WITHIN_DISC, label: 'inside the radius', help: 'A point covers every cell within its radius, whatever its shape would read there.' },
  {
    value: WITHIN_PROFILE_ABOVE,
    label: 'where its shape clears a level',
    help: 'A point covers only the cells where the stamp shape it would press in stands above the level below. This is what turns "how tall is it here" into "does it break the surface here at all".',
  },
] as const;

registerNodeType({
  type: 'pointAttributeField',
  title: 'read a point attribute into a field',
  category: 'points',
  description:
    'Writes, at every cell, one attribute of the points covering it — not the shape they make, the number they carry. A cell may be covered by a plain disc around each point or only where the shape a point would press in clears a level, and the reduce rule picks which of the covering points the cell listens to.',
  whenToUse:
    'When the answer is a fact about a point rather than a height: the year the earliest island to reach this spot was born, how rich the nearest seam is, how many camps can see this valley. Keep it separate from stamping: a stamp answers "how tall", this answers "whose, and which of theirs". The missing value below is the cell\'s answer when nothing covers it, and it deserves a deliberate choice rather than a silent 0.',
  inputs: {
    points: {
      kind: 'points',
      label: 'points',
      help: 'The points to read, gathered from every chunk within the gather radius below.',
    },
  },
  params: {
    attrKey: {
      kind: 'pointKey',
      label: 'attribute',
      help: 'Which attribute of the wired points this field is made of.',
      from: 'points',
      default: BORN,
    },
    reduce: {
      kind: 'choice',
      label: 'reduce',
      help: 'How several covering points become one number.',
      options: REDUCE_CHOICES,
      default: REDUCE_MIN,
    },
    missing: {
      kind: 'number',
      label: 'missing',
      help: 'What a cell no point covers reads. Pick it on purpose: it is the difference between a labelled "never" and a date that happens to be zero.',
      min: -5_000_000,
      max: 5_000_000,
      step: 1,
      default: 0,
    },
    within: {
      kind: 'choice',
      label: 'covered when',
      help: 'What it takes for a point to count as covering a cell.',
      options: WITHIN_CHOICES,
      default: WITHIN_DISC,
    },
    threshold: {
      kind: 'number',
      label: 'clears',
      help: 'The level a point\'s shape has to stand above at a cell before it counts as covering it — a sea level, a canopy height, a noise floor.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
      visibleWhen: { param: 'within', equals: WITHIN_PROFILE_ABOVE },
    },
    profile: {
      kind: 'choice',
      label: 'profile',
      help: 'The shape a point would press in, used here only as a test of what it reaches over — never written into the field.',
      options: STAMP_PROFILE_CHOICES,
      default: PROFILE_RIM,
      visibleWhen: { param: 'within', equals: WITHIN_PROFILE_ABOVE },
    },
    radiusFrom: {
      kind: 'choice',
      label: 'radius from',
      help: 'Whether every point reaches the same distance or each brings its own.',
      options: sourceChoices('radius', 'so big and small points cover different ground.'),
      default: FROM_ATTRIBUTE,
    },
    radius: {
      kind: 'number',
      label: 'radius',
      help: 'How far each point reaches, in tiles.',
      min: 1,
      max: 256,
      step: 1,
      default: 24,
      visibleWhen: { param: 'radiusFrom', equals: FROM_KNOB },
    },
    radiusKey: {
      kind: 'pointKey',
      label: 'radius attribute',
      help: 'Which attribute of the wired points holds each one\'s reach in tiles.',
      from: 'points',
      default: CONE_RADIUS,
      visibleWhen: { param: 'radiusFrom', equals: FROM_ATTRIBUTE },
    },
    weightFrom: {
      kind: 'choice',
      label: 'weight from',
      help: 'Whether every point\'s shape is worth the same at its centre or each brings its own. Only consulted by the shape test above.',
      options: sourceChoices('weight', 'so a tall cone clears a level that a low one does not.'),
      default: FROM_ATTRIBUTE,
    },
    weight: {
      kind: 'number',
      label: 'weight',
      help: 'What each point\'s shape is worth at its centre, for the shape test.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 1,
      visibleWhen: { param: 'weightFrom', equals: FROM_KNOB },
    },
    weightKey: {
      kind: 'pointKey',
      label: 'weight attribute',
      help: 'Which attribute of the wired points holds the height its shape stands at its centre.',
      from: 'points',
      default: CONE_HEIGHT,
      visibleWhen: { param: 'weightFrom', equals: FROM_ATTRIBUTE },
    },
    maxRadius: {
      kind: 'int',
      label: 'gather radius',
      help: 'How far, in tiles, this node looks for points — the one knob that decides what it costs. Set it to the largest reach any point can have; anything less clips the answer at chunk borders, anything more is paid for on every chunk.',
      min: 1,
      max: 256,
      default: 96,
    },
  },
  output: 'field',
  outputSemantic: (params) => (params.attrKey === BORN ? 'years' : 'raw'),
  generateChunk: attributeFieldChunk,
});

interface Cover {
  x: number;
  y: number;
  radius: number;
  weight: number;
  value: number;
}

function attributeFieldChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const missing = ctx.params.missing as number;
  if (!ctx.pointsInput('points')) return fieldValue(field.fill(missing));
  const covers = coversNear(ctx);
  const reduce = ctx.params.reduce as number;
  const test = coverTest(ctx.params);
  for (let y = 0; y < ctx.size; y++) {
    const worldY = ctx.originY + y;
    for (let x = 0; x < ctx.size; x++) {
      field[y * ctx.size + x] = reduced(ctx.originX + x, worldY, covers, reduce, test, missing);
    }
  }
  return fieldValue(field);
}

function coversNear(ctx: ChunkGenCtx): Cover[] {
  const attrKey = ctx.params.attrKey as string;
  return nearbyPoints(ctx, 'points', ctx.params.maxRadius as number).map((point) => ({
    x: point.x,
    y: point.y,
    radius: radiusOf(ctx, point),
    weight: weightOf(ctx, point),
    value: pointNumber(point, attrKey, 0),
  }));
}

function radiusOf(ctx: ChunkGenCtx, point: WorldPoint): number {
  if (ctx.params.radiusFrom === FROM_KNOB) return ctx.params.radius as number;
  return pointNumber(point, ctx.params.radiusKey as string, 0);
}

function weightOf(ctx: ChunkGenCtx, point: WorldPoint): number {
  if (ctx.params.weightFrom === FROM_KNOB) return ctx.params.weight as number;
  return pointNumber(point, ctx.params.weightKey as string, 0);
}

type CoverTest = (distance: number, cover: Cover) => boolean;

function coverTest(params: Record<string, ParamValue>): CoverTest {
  if (params.within !== WITHIN_PROFILE_ABOVE) {
    return (distance, cover) => distance < cover.radius;
  }
  const profile: StampProfile = { shape: params.profile as number, levels: 4, bands: 3, rimDepth: 0 };
  const threshold = params.threshold as number;
  return (distance, cover) => stampValueAt(distance, cover.radius, cover.weight, profile) > threshold;
}

function reduced(
  worldX: number,
  worldY: number,
  covers: readonly Cover[],
  reduce: number,
  test: CoverTest,
  missing: number,
): number {
  let total = 0;
  let count = 0;
  let best = 0;
  let nearest = Infinity;
  for (const cover of covers) {
    const distance = Math.hypot(worldX - cover.x, worldY - cover.y);
    if (!test(distance, cover)) continue;
    total += cover.value;
    best = count === 0 ? cover.value : pick(reduce, best, cover.value);
    if (distance < nearest) {
      nearest = distance;
      if (reduce === REDUCE_NEAREST) best = cover.value;
    }
    count++;
  }
  if (count === 0) return missing;
  if (reduce === REDUCE_SUM) return total;
  if (reduce === REDUCE_MEAN) return total / count;
  return best;
}

function pick(reduce: number, best: number, value: number): number {
  if (reduce === REDUCE_MAX) return Math.max(best, value);
  if (reduce === REDUCE_MIN) return Math.min(best, value);
  return best;
}
