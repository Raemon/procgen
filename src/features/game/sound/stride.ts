export const STRIDE_REST_MS = 260;

const STEPS_TO_FULL_MOMENTUM = 4;
const SETTLES_AFTER_STEPS = 2;

export interface Stride {
  steps: number;
  dx: number;
  dy: number;
}

export function restingStride(): Stride {
  return { steps: 0, dx: 0, dy: 0 };
}

export function strideAfterStep(stride: Stride, dx: number, dy: number): Stride {
  const sameWay = stride.steps > 0 && stride.dx === dx && stride.dy === dy;
  return { steps: sameWay ? stride.steps + 1 : 1, dx, dy };
}

export function momentumOf(stride: Stride): number {
  return Math.min(1, Math.max(0, stride.steps - 1) / STEPS_TO_FULL_MOMENTUM);
}

export function strideEndsInASettle(stride: Stride): boolean {
  return stride.steps >= SETTLES_AFTER_STEPS;
}
