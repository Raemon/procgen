import type { CellPoint } from '@/features/game/nearestWalkable';

export interface WalkLimits {
  stepBudget: number;
  radiusCap: number;
}

export const CARDINAL_STEPS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
] as const;

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function cellFromKey(key: string): CellPoint {
  const [x, y] = key.split(',').map(Number);
  return { x: x ?? 0, y: y ?? 0 };
}
