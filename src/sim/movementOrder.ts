import type { FacingIndex } from '../world/facing';

export const TICK_MS = 50;
export const MOVE_COOLDOWN_TICKS = 3;
export const DIAGONAL_MOVE_COOLDOWN_TICKS = 4;

export const ORDER_NONE = 0;
export const ORDER_DIR = 1;
export const ORDER_STEP = 2;

export type OrderKind = typeof ORDER_NONE | typeof ORDER_DIR | typeof ORDER_STEP;

export interface MovementOrder {
  kind: OrderKind;
  dir: FacingIndex;
  stepped: boolean;
}

export interface MovingBody {
  cooldown: number;
  moveDir: number;
  order: MovementOrder;
}

export function idleOrder(): MovementOrder {
  return { kind: ORDER_NONE, dir: 0, stepped: false };
}

export function restingBody(): MovingBody {
  return { cooldown: 0, moveDir: -1, order: idleOrder() };
}

export function holdDirection(body: MovingBody, dir: FacingIndex): void {
  if (body.order.kind === ORDER_DIR && body.order.dir === dir) return;
  body.order = { kind: ORDER_DIR, dir, stepped: false };
}

export function releaseOrder(body: MovingBody): void {
  body.order =
    body.order.kind === ORDER_DIR && !body.order.stepped
      ? { kind: ORDER_STEP, dir: body.order.dir, stepped: false }
      : idleOrder();
}

export function isDirIndex(dir: unknown): dir is FacingIndex {
  return typeof dir === 'number' && Number.isInteger(dir) && dir >= 0 && dir <= 7;
}
