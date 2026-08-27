import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import {
  PROFILE_RIM,
  STAMP_PROFILE_CHOICES,
  stampValueAt,
  type StampProfile,
} from '../../shape/pointStamp';
import { PROFILE_BELL, PROFILE_SAWTOOTH, PROFILE_STEPS } from '../../shape/fieldProfile';
import { fieldValue, type ChunkValue, type WorldPoint } from '../../values/chunkValues';
import { nearbyPoints } from '../../values/nearbyPoints';
import { ANGLE, RIM_DEPTH, STAMP_RADIUS, STAMP_WEIGHT, pointNumber } from '../../values/pointData';
import { FROM_ATTRIBUTE, FROM_KNOB, sourceChoices } from './pointSourceChoice';

const COMBINE_MAX = 0;
const COMBINE_SUM = 1;
const COMBINE_MIN = 2;

const COMBINE_CHOICES = [
  {
    value: COMBINE_MAX,
    label: 'max',
    help: 'Overlapping stamps keep the tallest reading, so two cones side by side make a saddle rather than a spike.',
  },
  {
    value: COMBINE_SUM,
    label: 'sum',
    help: 'Overlapping stamps add up, so a cluster piles higher than any one of its members. Ashfall, light pollution, wear.',
  },
  {
    value: COMBINE_MIN,
    label: 'min',
    help: 'Overlapping stamps keep the lowest reading. Useful when the stamp is a distance or a cost rather than a height.',
  },
] as const;

registerNodeType({
  type: 'stampPointsField',
  title: 'stamp points into a field',
  category: 'points',
  description:
    'Presses one shape into an empty field around every nearby point: a bell for a dome or a sinkhole, a ring for a crater lip or an atoll, a rim for a cone with the bowl bitten out of its summit. Radius and weight come either from a knob for the whole field or from each point\'s own attributes, and where two stamps overlap the combine rule decides which wins.',
  whenToUse:
    'Whenever points should become ground rather than props: sinkholes, towers, oases, craters, spires, motu, how near the nearest road runs. Give it a scatter with a range of radii and you get a field of different-sized blobs from one node. Set the aspect above 1 and the stamps stretch along each point\'s angle, turning discs into bars, drumlins and prisms.',
  inputs: {
    points: {
      kind: 'points',
      label: 'points',
      help: 'The points to stamp, gathered from every chunk within the gather radius below.',
    },
  },
  params: {
    profile: {
      kind: 'choice',
      label: 'profile',
      help: 'The shape pressed in around each point, read from its centre out to its radius.',
      options: STAMP_PROFILE_CHOICES,
      default: PROFILE_BELL,
    },
    levels: {
      kind: 'int',
      label: 'levels',
      help: 'How many flat rings the stepped falloff has, counting both ends.',
      min: 2,
      max: 16,
      default: 4,
      visibleWhen: { param: 'profile', equals: PROFILE_STEPS },
    },
    bands: {
      kind: 'int',
      label: 'bands',
      help: 'How many times the sawtooth repeats between the centre and the edge — concentric terraces, ripples, tree rings.',
      min: 1,
      max: 8,
      default: 3,
      visibleWhen: { param: 'profile', equals: PROFILE_SAWTOOTH },
    },
    rimDepth: {
      kind: 'number',
      label: 'rim depth',
      help: 'How deep the summit bowl dips, in field units, for points that do not carry their own. Zero gives a smooth power cone.',
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.12,
      visibleWhen: { param: 'profile', equals: PROFILE_RIM },
    },
    rimDepthKey: {
      kind: 'pointKey',
      label: 'rim depth from',
      help: 'Attribute holding each point\'s own bowl depth. Points that do not carry it fall back to the knob above, so one stamp can hold both fresh craters and weathered domes.',
      from: 'points',
      default: RIM_DEPTH,
      visibleWhen: { param: 'profile', equals: PROFILE_RIM },
    },
    radiusFrom: {
      kind: 'choice',
      label: 'radius from',
      help: 'Whether every stamp is the same size or each point brings its own.',
      options: sourceChoices('radius', 'the way a scatter of mixed sizes stays mixed.'),
      default: FROM_KNOB,
    },
    radius: {
      kind: 'number',
      label: 'radius',
      help: 'How far each stamp reaches, in tiles. Beyond it the point writes nothing at all.',
      min: 1,
      max: 256,
      step: 1,
      default: 24,
      visibleWhen: { param: 'radiusFrom', equals: FROM_KNOB },
    },
    radiusKey: {
      kind: 'pointKey',
      label: 'radius attribute',
      help: 'Which attribute of the wired points holds each one\'s radius in tiles.',
      from: 'points',
      default: STAMP_RADIUS,
      visibleWhen: { param: 'radiusFrom', equals: FROM_ATTRIBUTE },
    },
    weightFrom: {
      kind: 'choice',
      label: 'weight from',
      help: 'Whether every stamp is worth the same at its centre or each point brings its own.',
      options: sourceChoices('weight', 'so tall cones and low shields can share one node.'),
      default: FROM_KNOB,
    },
    weight: {
      kind: 'number',
      label: 'weight',
      help: 'What the profile is worth where it reads 1 — the height of the dome or the depth of the pit before anything downstream subtracts it.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 1,
      visibleWhen: { param: 'weightFrom', equals: FROM_KNOB },
    },
    weightKey: {
      kind: 'pointKey',
      label: 'weight attribute',
      help: 'Which attribute of the wired points holds each one\'s weight.',
      from: 'points',
      default: STAMP_WEIGHT,
      visibleWhen: { param: 'weightFrom', equals: FROM_ATTRIBUTE },
    },
    combine: {
      kind: 'choice',
      label: 'combine',
      help: 'What happens where two stamps overlap. Cells no stamp reaches stay at 0 whichever you pick.',
      options: COMBINE_CHOICES,
      default: COMBINE_MAX,
    },
    orientFrom: {
      kind: 'pointKey',
      label: 'angle attribute',
      help: 'Which attribute holds each point\'s heading in radians. Only read once the aspect is above 1; points without it lie east-west.',
      from: 'points',
      default: ANGLE,
    },
    aspect: {
      kind: 'number',
      label: 'aspect',
      help: 'How many times longer a stamp is along its angle than across it. 1 is a disc; 3 is a drumlin; 8 is a bar or a wall.',
      min: 1,
      max: 12,
      step: 0.1,
      default: 1,
    },
    maxRadius: {
      kind: 'int',
      label: 'gather radius',
      help: 'How far, in tiles, this node looks for points to stamp — the one knob that decides what it costs. It cannot be worked out for you: once a radius comes from a point attribute, knowing how far to look would mean already having gathered the points. Set it to the largest radius any point can have, or stamps will be cut off at chunk borders; set it far higher than that and every chunk pays for points it never uses.',
      min: 1,
      max: 256,
      default: 48,
    },
  },
  output: 'field',
  outputSemantic: 'raw',
  generateChunk: stampChunk,
});

interface Stamp {
  x: number;
  y: number;
  radius: number;
  weight: number;
  cos: number;
  sin: number;
  profile: StampProfile;
}

function stampChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  if (!ctx.pointsInput('points')) return fieldValue(field);
  const stamps = stampsNear(ctx);
  const combine = ctx.params.combine as number;
  const aspect = ctx.params.aspect as number;
  for (let y = 0; y < ctx.size; y++) {
    const worldY = ctx.originY + y;
    for (let x = 0; x < ctx.size; x++) {
      field[y * ctx.size + x] = stampedAt(ctx.originX + x, worldY, stamps, combine, aspect);
    }
  }
  return fieldValue(field);
}

function stampsNear(ctx: ChunkGenCtx): Stamp[] {
  const profile = profileOf(ctx);
  const rimDepthKey = ctx.params.rimDepthKey as string;
  return nearbyPoints(ctx, 'points', ctx.params.maxRadius as number).map((point) => {
    const angle = pointNumber(point, ctx.params.orientFrom as string, 0);
    return {
      x: point.x,
      y: point.y,
      radius: radiusOf(ctx, point),
      weight: weightOf(ctx, point),
      cos: Math.cos(angle),
      sin: Math.sin(angle),
      profile: { ...profile, rimDepth: pointNumber(point, rimDepthKey, profile.rimDepth) },
    };
  });
}

function profileOf(ctx: ChunkGenCtx): StampProfile {
  return {
    shape: ctx.params.profile as number,
    levels: ctx.params.levels as number,
    bands: ctx.params.bands as number,
    rimDepth: ctx.params.rimDepth as number,
  };
}

function radiusOf(ctx: ChunkGenCtx, point: WorldPoint): number {
  if (ctx.params.radiusFrom === FROM_KNOB) return ctx.params.radius as number;
  return pointNumber(point, ctx.params.radiusKey as string, 0);
}

function weightOf(ctx: ChunkGenCtx, point: WorldPoint): number {
  if (ctx.params.weightFrom === FROM_KNOB) return ctx.params.weight as number;
  return pointNumber(point, ctx.params.weightKey as string, 0);
}

function stampedAt(
  worldX: number,
  worldY: number,
  stamps: readonly Stamp[],
  combine: number,
  aspect: number,
): number {
  let value = 0;
  let hit = false;
  for (const stamp of stamps) {
    const distance = metricDistance(worldX, worldY, stamp, aspect);
    if (distance >= stamp.radius) continue;
    const reading = stampValueAt(distance, stamp.radius, stamp.weight, stamp.profile);
    value = hit ? combined(combine, value, reading) : reading;
    hit = true;
  }
  return value;
}

function metricDistance(worldX: number, worldY: number, stamp: Stamp, aspect: number): number {
  const dx = worldX - stamp.x;
  const dy = worldY - stamp.y;
  if (aspect === 1) return Math.hypot(dx, dy);
  const along = dx * stamp.cos + dy * stamp.sin;
  const across = dy * stamp.cos - dx * stamp.sin;
  return Math.hypot(along / aspect, across);
}

function combined(combine: number, value: number, reading: number): number {
  if (combine === COMBINE_SUM) return value + reading;
  if (combine === COMBINE_MIN) return Math.min(value, reading);
  return Math.max(value, reading);
}
