import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { PRESENT } from '../../time/worldTime';
import { pointsValue, type ChunkValue, type PointsChunk, type WorldPoint } from '../../values/chunkValues';
import { BORN, RICHNESS, SENT_FROM_X, SENT_FROM_Y, pointNumber } from '../../values/pointData';
import { nearbyPointsOf } from './nearbyPoints';

export const CAMP_TAG = 'camp';

registerNodeType({
  type: 'miningCamps',
  title: 'mining camps',
  category: 'settlement',
  description:
    'Puts a camp beside a deposit once a village near enough has stood long enough to want it, so the camp carries a founding date later than the village that sent it.',
  whenToUse:
    'Wire in the deposits and the villages that would work them. Camps only appear where ore and people already overlap, which is what makes a mining town read as a consequence rather than a coincidence.',
  inputs: {
    deposits: {
      kind: 'points',
      label: 'deposits',
      help: 'Mineral deposits. Each may raise at most one camp.',
    },
    villages: {
      kind: 'points',
      label: 'villages',
      help: 'The settlements that would send miners out. A deposit beyond every village stays untouched.',
    },
  },
  params: {
    maxHaul: {
      kind: 'int',
      label: 'haul distance',
      help: 'How far in tiles a village will work a deposit. Beyond this the ore lies where it fell.',
      min: 16,
      max: 512,
      default: 176,
    },
    campDelay: {
      kind: 'number',
      label: 'camp delay',
      help: 'Years after a village is founded before it sends miners out to the ore it can reach.',
      min: 0,
      max: 400,
      step: 5,
      default: 70,
    },
  },
  output: 'points',
  generateChunk: miningCampsChunk,
});

function miningCampsChunk(ctx: ChunkGenCtx): ChunkValue {
  const deposits = ctx.pointsInput('deposits');
  if (!deposits || deposits.length === 0 || !ctx.pointsInput('villages')) return pointsValue([]);
  const villages = nearbyPointsOf(ctx, 'villages', ctx.params.maxHaul as number);
  const camps: PointsChunk = [];
  for (const deposit of deposits) collectCampFor(ctx, deposit, villages, camps);
  return pointsValue(camps);
}

function collectCampFor(
  ctx: ChunkGenCtx,
  deposit: WorldPoint,
  villages: readonly WorldPoint[],
  into: PointsChunk,
): void {
  const village = workingVillageOf(ctx, deposit, villages);
  if (!village) return;
  into.push({
    x: deposit.x,
    y: deposit.y,
    tag: CAMP_TAG,
    data: {
      [BORN]: pointNumber(village, BORN, PRESENT) + (ctx.params.campDelay as number),
      [RICHNESS]: pointNumber(deposit, RICHNESS, 0),
      [SENT_FROM_X]: village.x,
      [SENT_FROM_Y]: village.y,
    },
  });
}

function workingVillageOf(
  ctx: ChunkGenCtx,
  deposit: WorldPoint,
  villages: readonly WorldPoint[],
): WorldPoint | null {
  const maxHaul = ctx.params.maxHaul as number;
  let nearest: WorldPoint | null = null;
  let nearestDistance = Infinity;
  for (const village of villages) {
    const distance = Math.hypot(village.x - deposit.x, village.y - deposit.y);
    if (distance > maxHaul || distance >= nearestDistance) continue;
    nearest = village;
    nearestDistance = distance;
  }
  return nearest;
}
