import { doorTagFor, keyTagFor } from '../../../quest/questTags';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type WorldPoint } from '../../values/chunkValues';
import { eachDistrictTouchingChunk, vaultSpecOf, type VaultPlan } from './vaultPlan';

export const EMIT_DOORS = 0;
export const EMIT_KEYS = 1;
export const EMIT_TREASURE = 2;

registerNodeType({
  type: 'vaultPoints',
  title: 'vault points',
  category: 'quest',
  description:
    'Emits the quest points of the vault lattice: door cells tagged door:<district>, key cells tagged key:<district>, or the treasure cell at each vault center.',
  whenToUse:
    'The mechanical half of a lock-and-key quest. Add one instance per emit choice, matching the district span and vault size of a vault walls node. The quest layer locks every door: cell until the actor holds the matching key: — collected by stepping on the key point, or by catching the creature spawned from it when the display is creatures.',
  inputs: {},
  params: {
    districtSpan: {
      kind: 'int',
      label: 'district span',
      help: 'Side length in tiles of each district. Must match the vault walls node this pairs with, or the points will not line up with the walls.',
      min: 48,
      max: 256,
      default: 96,
    },
    vaultSize: {
      kind: 'int',
      label: 'vault size',
      help: 'Side length in tiles of the walled square. Must match the vault walls node this pairs with.',
      min: 7,
      max: 31,
      default: 11,
    },
    emit: {
      kind: 'choice',
      label: 'emit',
      help: 'Which of the plan\'s points this instance emits.',
      options: [
        {
          value: EMIT_DOORS,
          label: 'doors',
          help: 'One point on each vault\'s door cell, tagged door:<district>. The quest layer keeps that cell impassable until the matching key is held.',
        },
        {
          value: EMIT_KEYS,
          label: 'keys',
          help: 'One point per district where the key rests, tagged key:<district>. Stepping on it takes the key; display it as creatures to make a keeper carry it instead.',
        },
        {
          value: EMIT_TREASURE,
          label: 'treasure',
          help: 'One point at each vault\'s center, tagged treasure — the prize the door protects.',
        },
      ],
      default: EMIT_DOORS,
    },
  },
  output: 'points',
  generateChunk: vaultPointsChunk,
});

function vaultPointsChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: WorldPoint[] = [];
  eachDistrictTouchingChunk(ctx, vaultSpecOf(ctx), (plan) => {
    const point = emittedPoint(plan, ctx.params.emit as number);
    if (isInsideChunk(ctx, point.x, point.y)) points.push(point);
  });
  return pointsValue(points);
}

function emittedPoint(plan: VaultPlan, emit: number): WorldPoint {
  if (emit === EMIT_KEYS) return { x: plan.keyX, y: plan.keyY, tag: keyTagFor(plan.id) };
  if (emit === EMIT_TREASURE) return { x: plan.treasureX, y: plan.treasureY, tag: 'treasure' };
  return { x: plan.doorX, y: plan.doorY, tag: doorTagFor(plan.id) };
}

function isInsideChunk(ctx: ChunkGenCtx, x: number, y: number): boolean {
  return (
    x >= ctx.originX &&
    x < ctx.originX + ctx.size &&
    y >= ctx.originY &&
    y < ctx.originY + ctx.size
  );
}
