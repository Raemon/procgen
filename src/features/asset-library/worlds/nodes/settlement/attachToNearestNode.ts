import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { PRESENT } from '../../time/worldTime';
import { pointsValue, type ChunkValue, type PointsChunk, type WorldPoint } from '../../values/chunkValues';
import {
  ANCHOR_ATTRS,
  ANCHOR_X,
  ANCHOR_Y,
  BORN,
  BORN_ATTR,
  RICHNESS,
  pointNumber,
} from '../../values/pointData';
import { nearbyPoints } from '../../values/nearbyPoints';

registerNodeType({
  type: 'attachToNearest',
  title: 'attach to the nearest',
  category: 'settlement',
  description:
    'Keeps a source point only if some anchor point lies within reach of it, and dates the survivor from the anchor that claimed it plus a delay. Sources no anchor can reach are dropped, and the point remembers where its anchor stood.',
  whenToUse:
    'Anywhere one thing exists because another thing was already there: a mining camp beside ore a village can work, a shrine on a peak a road passes, a quarry near a town that needs stone. Wiring it this way is what makes the second thing read as a consequence rather than a coincidence — and because the date comes from the anchor, scrubbing time takes the child away before the parent.',
  inputs: {
    sources: {
      kind: 'points',
      label: 'sources',
      help: 'The places something could stand. Each may raise at most one attachment, on its own spot.',
    },
    anchors: {
      kind: 'points',
      requiresPointAttributes: [BORN],
      label: 'anchors',
      help: 'The points that reach out and claim them, carrying the date the claim could start from. A source beyond every anchor stays untouched.',
    },
  },
  params: {
    maxReach: {
      kind: 'int',
      label: 'reach',
      help: 'How far in tiles an anchor will claim a source. Beyond this the source is left where it lies.',
      min: 16,
      max: 512,
      default: 176,
    },
    delay: {
      kind: 'number',
      label: 'delay',
      help: 'Years after the anchor\'s own founding before it gets round to the thing it claimed.',
      min: 0,
      max: 400,
      step: 5,
      default: 70,
    },
    copyFromSource: {
      kind: 'pointKey',
      label: 'carry from source',
      help: 'One attribute of the source point carried onto the attachment — what is there, as opposed to who came for it.',
      from: 'sources',
      default: RICHNESS,
    },
    copyFromAnchor: {
      kind: 'pointKey',
      label: 'carry from anchor',
      help: 'One attribute of the claiming anchor carried onto the attachment, so the child can be told which parent it belongs to.',
      from: 'anchors',
      default: BORN,
    },
  },
  output: 'points',
  pointAttributes: [BORN_ATTR, ...ANCHOR_ATTRS],
  generateChunk: attachChunk,
});

function attachChunk(ctx: ChunkGenCtx): ChunkValue {
  const sources = ctx.pointsInput('sources');
  if (!sources || sources.length === 0 || !ctx.pointsInput('anchors')) return pointsValue([]);
  const anchors = nearbyPoints(ctx, 'anchors', ctx.params.maxReach as number);
  const attached: PointsChunk = [];
  for (const source of sources) collectAttachment(ctx, source, anchors, attached);
  return pointsValue(attached);
}

function collectAttachment(
  ctx: ChunkGenCtx,
  source: WorldPoint,
  anchors: readonly WorldPoint[],
  into: PointsChunk,
): void {
  const anchor = nearestAnchorOf(ctx, source, anchors);
  if (!anchor) return;
  into.push({
    x: source.x,
    y: source.y,
    tag: ctx.nodeId,
    data: {
      [ctx.params.copyFromAnchor as string]: pointNumber(anchor, ctx.params.copyFromAnchor as string, 0),
      [ctx.params.copyFromSource as string]: pointNumber(source, ctx.params.copyFromSource as string, 0),
      [BORN]: pointNumber(anchor, BORN, PRESENT) + (ctx.params.delay as number),
      [ANCHOR_X]: anchor.x,
      [ANCHOR_Y]: anchor.y,
    },
  });
}

function nearestAnchorOf(
  ctx: ChunkGenCtx,
  source: WorldPoint,
  anchors: readonly WorldPoint[],
): WorldPoint | null {
  const maxReach = ctx.params.maxReach as number;
  let nearest: WorldPoint | null = null;
  let nearestDistance = Infinity;
  for (const anchor of anchors) {
    const distance = Math.hypot(anchor.x - source.x, anchor.y - source.y);
    if (distance > maxReach || distance >= nearestDistance) continue;
    nearest = anchor;
    nearestDistance = distance;
  }
  return nearest;
}
