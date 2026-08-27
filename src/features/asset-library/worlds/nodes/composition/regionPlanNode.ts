import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

export const REGION_ROLE_FOCUS = 0;
export const REGION_ROLE_WILDERNESS = 1;
export const REGION_ROLE_FRONTIER = 2;

const ROLE_CHOICES = [
  { value: REGION_ROLE_FOCUS, label: 'focus', help: 'High near a chosen place, fading with distance.' },
  { value: REGION_ROLE_WILDERNESS, label: 'wilderness', help: 'High in the country between places.' },
  { value: REGION_ROLE_FRONTIER, label: 'frontier', help: 'Peaked where a place gives way to the wilds.' },
] as const;

const JITTER_SHARE = 0.3;

registerNodeType({
  type: 'regionPlan',
  title: 'region plan',
  category: 'terrain',
  description:
    'Chooses a few focus places on a huge jittered lattice and reports each cell\'s relation to the nearest one: high near a focus, low in the wilderness between, or peaked on the frontier where the two meet.',
  whenToUse:
    'The cure for worlds that are the same everywhere. Mask settlement centers by focus and towns gather into a few real places with wild country between; mask mountain noise by a sparse focus and one massif owns the horizon; mask discoveries by frontier and the journey between places is where things happen.',
  inputs: {},
  params: {
    pitch: {
      kind: 'int',
      label: 'place spacing',
      help: 'Distance in tiles between candidate places on the macro lattice. Bigger pitch means fewer, farther-apart places.',
      min: 128,
      max: 1024,
      default: 384,
    },
    focusShare: {
      kind: 'number',
      label: 'focus share',
      help: 'The fraction of lattice cells that become focus places. Low values leave most of the world as wilderness.',
      min: 0.05,
      max: 0.6,
      step: 0.05,
      default: 0.2,
    },
    falloff: {
      kind: 'number',
      label: 'influence reach',
      help: 'How far a focus place is felt, as a share of the place spacing.',
      min: 0.25,
      max: 1.2,
      step: 0.05,
      default: 0.6,
    },
    role: {
      kind: 'choice',
      label: 'role',
      help: 'Which side of the plan this field reports: the places, the wilds between them, or the frontier where they meet.',
      options: ROLE_CHOICES,
      default: REGION_ROLE_FOCUS,
    },
  },
  output: 'field',
  outputSemantic: 'unit',
  generateChunk: regionPlanChunk,
});

function regionPlanChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const pitch = Math.max(128, Math.round(ctx.params.pitch as number));
  const reach = (ctx.params.falloff as number) * pitch;
  const role = ctx.params.role as number;
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const influence = focusInfluenceAt(ctx, ctx.originX + x, ctx.originY + y, pitch, reach);
      out[y * ctx.size + x] = roleValueOf(role, influence);
    }
  }
  return fieldValue(out);
}

function roleValueOf(role: number, influence: number): number {
  if (role === REGION_ROLE_WILDERNESS) return 1 - influence;
  if (role === REGION_ROLE_FRONTIER) return 1 - Math.abs(2 * influence - 1);
  return influence;
}

function focusInfluenceAt(
  ctx: ChunkGenCtx,
  worldX: number,
  worldY: number,
  pitch: number,
  reach: number,
): number {
  const cellX = Math.floor(worldX / pitch);
  const cellY = Math.floor(worldY / pitch);
  const span = Math.ceil(reach / pitch);
  let strongest = 0;
  for (let dy = -span; dy <= span; dy++) {
    for (let dx = -span; dx <= span; dx++) {
      const pull = pullOfCell(ctx, cellX + dx, cellY + dy, pitch, reach, worldX, worldY);
      strongest = Math.max(strongest, pull);
    }
  }
  return strongest;
}

function pullOfCell(
  ctx: ChunkGenCtx,
  cellX: number,
  cellY: number,
  pitch: number,
  reach: number,
  worldX: number,
  worldY: number,
): number {
  if (ctx.hash01(cellX, cellY, 'region-role') >= (ctx.params.focusShare as number)) return 0;
  const centerX = (cellX + 0.5 + (ctx.hash01(cellX, cellY, 'region-jx') - 0.5) * JITTER_SHARE) * pitch;
  const centerY = (cellY + 0.5 + (ctx.hash01(cellX, cellY, 'region-jy') - 0.5) * JITTER_SHARE) * pitch;
  const distance = Math.hypot(worldX - centerX, worldY - centerY);
  return Math.max(0, 1 - distance / reach);
}
