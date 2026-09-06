import { facingVector, type FacingIndex } from '../facing';
import {
  DIAGONAL_MOVE_COOLDOWN_TICKS,
  JUMP_COOLDOWN_TICKS,
  JUMP_UP,
  MOVE_COOLDOWN_TICKS,
  ORDER_NONE,
  ORDER_STEP,
  idleOrder,
  takeJumpRequest,
  type JumpRequest,
  type MovingBody,
} from './movementOrder';

export interface StepDelta {
  dx: number;
  dy: number;
  jumped?: boolean;
}

export interface TickRules {
  canStepTo(fromX: number, fromY: number, toX: number, toY: number): boolean;
  jumpLanding(fromX: number, fromY: number, dx: number, dy: number): StepDelta | null;
}

export function tickMovement(
  body: MovingBody,
  x: number,
  y: number,
  rules: TickRules,
): StepDelta | null {
  if (body.cooldown > 0) body.cooldown -= 1;
  if (body.cooldown > 0) return null;
  const jump = takeJumpRequest(body);
  if (jump !== null) return beginJump(body, jump, x, y, rules);
  const order = body.order;
  if (order.kind === ORDER_NONE) return null;
  const delta = walkableStepToward(order.dir, x, y, (nx, ny) => rules.canStepTo(x, y, nx, ny));
  if (order.kind === ORDER_STEP) body.order = idleOrder();
  if (!delta) return null;
  order.stepped = true;
  beginHop(body, delta);
  return delta;
}

function beginJump(
  body: MovingBody,
  jump: JumpRequest,
  x: number,
  y: number,
  rules: TickRules,
): StepDelta | null {
  body.cooldown = JUMP_COOLDOWN_TICKS;
  body.moveDir = -1;
  const hopInPlace = { dx: 0, dy: 0, jumped: true };
  if (jump === JUMP_UP) return hopInPlace;
  const heading = facingVector(jump);
  const delta = rules.jumpLanding(x, y, heading.dx, heading.dy);
  if (!delta) return hopInPlace;
  body.moveDir = jump;
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
  canEnter: (nx: number, ny: number) => boolean,
): StepDelta | null {
  const v = facingVector(dir);
  if (canEnter(x + v.dx, y + v.dy)) return { dx: v.dx, dy: v.dy };
  if (v.dx === 0 || v.dy === 0) return null;
  if (canEnter(x + v.dx, y)) return { dx: v.dx, dy: 0 };
  if (canEnter(x, y + v.dy)) return { dx: 0, dy: v.dy };
  return null;
}

export function stepDirIndex(dx: number, dy: number): FacingIndex | null {
  for (let dir = 0; dir < 8; dir++) {
    const v = facingVector(dir as FacingIndex);
    if (v.dx === Math.sign(dx) && v.dy === Math.sign(dy)) return dir as FacingIndex;
  }
  return null;
}
