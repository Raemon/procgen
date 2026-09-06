import { namedCells, strings } from '@/features/game/sharedSnapshot';
import type { PuzzleStateSnapshot } from './puzzleState';

export function sanitizePuzzleSnapshot(raw: unknown): PuzzleStateSnapshot {
  const held = (raw ?? {}) as { on?: unknown; crates?: unknown };
  return { on: strings(held.on), crates: namedCells(held.crates) };
}
