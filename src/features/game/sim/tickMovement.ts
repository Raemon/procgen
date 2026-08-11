import { facingVector, type FacingIndex } from '../facing';
import {
  DIAGONAL_MOVE_COOLDOWN_TICKS,
  MOVE_COOLDOWN_TICKS,
  ORDER_NONE,
  ORDER_STEP,
  idleOrder,
  type MovingBody,
} from './movementOrder';

export interface StepDelta {
  dx: number;
  dy: number;
}

export type WalkabilityProbe = (x: number, y: number) => boolean;

export function tickMovement(
  body: MovingBody,
  x: number,
  y: number,
  isWalkable: WalkabilityProbe,
): StepDelta | null {
  if (body.cooldown > 0) body.cooldown -= 1;
  if (body.cooldown > 0) return null;
  const order = body.order;
  if (order.kind === ORDER_NONE) return null;
  const delta = walkableStepToward(order.dir, x, y, isWalkable);
  if (order.kind === ORDER_STEP) body.order = idleOrder();
  if (!delta) return null;
  order.stepped = true;
  beginHop(body, delta);
  return delta;
}

function beginHop(body: MovingBody, delta: StepDelta): void {
  body.moveDir = stepDirIndex(delta.dx, delta.dy) ?? -1;
  body.cooldown = delta.dx !== 0 && delta.dy !== 0 ? DIAGONAL_MOVE_COOLDOWN_TICKS : MOVE_COOLDOWN_TICKS;
}

function walkableStepToward(
  dir: FacingIndex,
  x: number,
  y: number,
  isWalkable: WalkabilityProbe,
): StepDelta | null {
  const v = facingVector(dir);
  if (isWalkable(x + v.dx, y + v.dy)) return { dx: v.dx, dy: v.dy };
  if (v.dx === 0 || v.dy === 0) return null;
  if (isWalkable(x + v.dx, y)) return { dx: v.dx, dy: 0 };
  if (isWalkable(x, y + v.dy)) return { dx: 0, dy: v.dy };
  return null;
}

export function stepDirIndex(dx: number, dy: number): FacingIndex | null {
  for (let dir = 0; dir < 8; dir++) {
    const v = facingVector(dir as FacingIndex);
    if (v.dx === Math.sign(dx) && v.dy === Math.sign(dy)) return dir as FacingIndex;
  }
  return null;
}
