import type { PuzzleStateSnapshot } from './puzzleState';

export function sanitizePuzzleSnapshot(raw: unknown): PuzzleStateSnapshot {
  const held = (raw ?? {}) as { on?: unknown; crates?: unknown };
  return {
    on: Array.isArray(held.on) ? held.on.filter((id): id is string => typeof id === 'string') : [],
    crates: Array.isArray(held.crates)
      ? held.crates.filter(
          (crate): crate is [string, number, number] =>
            Array.isArray(crate) &&
            crate.length === 3 &&
            typeof crate[0] === 'string' &&
            isFiniteNumber(crate[1]) &&
            isFiniteNumber(crate[2]),
        )
      : [],
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
