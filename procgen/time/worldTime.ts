export const PRESENT = 0;

export const VOLCANIC_ERA_SPAN = 5_000_000;

export const DEEPEST_PAST = -VOLCANIC_ERA_SPAN;

export function clampTime(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return PRESENT;
  return Math.max(DEEPEST_PAST, Math.min(PRESENT, raw));
}
