import type { RandomStream } from '../../../random/mulberry32';
import type { ChunkGenCtx } from '../../nodeType';

const DISTRICT_MARGIN = 2;
const KEY_PLACEMENT_TRIES = 24;

export interface VaultPlan {
  id: string;
  left: number;
  top: number;
  size: number;
  doorX: number;
  doorY: number;
  keyX: number;
  keyY: number;
  treasureX: number;
  treasureY: number;
}

export interface VaultSpec {
  districtSpan: number;
  vaultSize: number;
}

export function vaultSpecOf(ctx: ChunkGenCtx): VaultSpec {
  return {
    districtSpan: ctx.params.districtSpan as number,
    vaultSize: ctx.params.vaultSize as number,
  };
}

export function vaultPlanFor(
  ctx: ChunkGenCtx,
  districtX: number,
  districtY: number,
  spec: VaultSpec,
): VaultPlan {
  const rng = ctx.worldRngAt(districtX, districtY, 'vault plan');
  const size = Math.min(spec.vaultSize, spec.districtSpan - DISTRICT_MARGIN * 2);
  const { left, top } = vaultCorner(rng, districtX, districtY, spec.districtSpan, size);
  const door = doorCell(rng, left, top, size);
  const key = keyCell(rng, districtX, districtY, spec.districtSpan, left, top, size);
  return {
    id: `${districtX},${districtY}`,
    left,
    top,
    size,
    doorX: door.x,
    doorY: door.y,
    keyX: key.x,
    keyY: key.y,
    treasureX: left + Math.floor(size / 2),
    treasureY: top + Math.floor(size / 2),
  };
}

export function districtRange(worldStart: number, worldEnd: number, span: number): [number, number] {
  return [Math.floor(worldStart / span), Math.floor(worldEnd / span)];
}

export function eachDistrictTouchingChunk(
  ctx: ChunkGenCtx,
  spec: VaultSpec,
  visit: (plan: VaultPlan) => void,
): void {
  const [firstX, lastX] = districtRange(ctx.originX, ctx.originX + ctx.size - 1, spec.districtSpan);
  const [firstY, lastY] = districtRange(ctx.originY, ctx.originY + ctx.size - 1, spec.districtSpan);
  for (let districtY = firstY; districtY <= lastY; districtY++) {
    for (let districtX = firstX; districtX <= lastX; districtX++) {
      visit(vaultPlanFor(ctx, districtX, districtY, spec));
    }
  }
}

function vaultCorner(
  rng: RandomStream,
  districtX: number,
  districtY: number,
  span: number,
  size: number,
): { left: number; top: number } {
  const maxOffset = span - size - DISTRICT_MARGIN * 2;
  return {
    left: districtX * span + DISTRICT_MARGIN + Math.floor(rng() * (maxOffset + 1)),
    top: districtY * span + DISTRICT_MARGIN + Math.floor(rng() * (maxOffset + 1)),
  };
}

function doorCell(rng: RandomStream, left: number, top: number, size: number): { x: number; y: number } {
  const along = 1 + Math.floor(rng() * (size - 2));
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: left + along, y: top };
  if (side === 1) return { x: left + size - 1, y: top + along };
  if (side === 2) return { x: left + along, y: top + size - 1 };
  return { x: left, y: top + along };
}

function keyCell(
  rng: RandomStream,
  districtX: number,
  districtY: number,
  span: number,
  left: number,
  top: number,
  size: number,
): { x: number; y: number } {
  for (let attempt = 0; attempt < KEY_PLACEMENT_TRIES; attempt++) {
    const x = districtX * span + Math.floor(rng() * span);
    const y = districtY * span + Math.floor(rng() * span);
    if (isOutsideVault(x, y, left, top, size)) return { x, y };
  }
  return { x: districtX * span, y: districtY * span };
}

function isOutsideVault(x: number, y: number, left: number, top: number, size: number): boolean {
  return x < left - 1 || x > left + size || y < top - 1 || y > top + size;
}
