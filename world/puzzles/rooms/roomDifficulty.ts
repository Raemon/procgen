import type { RandomStream } from '../../../procgen/random/mulberry32';
import { allPuzzleKinds, type PuzzleKindDef } from '../kinds/puzzleKind';

export interface RoomChallenge {
  kind: PuzzleKindDef | null;
  level: number;
}

export function roomRing(roomX: number, roomY: number): number {
  return Math.max(Math.abs(roomX), Math.abs(roomY));
}

export function challengeForRing(ring: number, rng: RandomStream): RoomChallenge {
  const kinds = allPuzzleKinds();
  if (ring === 0 || kinds.length === 0) return { kind: null, level: 0 };
  const introduction = kinds.find((kind) => kind.introducedAtRing === ring);
  if (introduction) return { kind: introduction, level: 0 };
  const unlocked = kinds.filter((kind) => kind.introducedAtRing < ring);
  if (unlocked.length === 0) return { kind: null, level: 0 };
  const kind = unlocked[Math.floor(rng() * unlocked.length)]!;
  return { kind, level: ring - lastTutorialRing(kinds) };
}

export function lastTutorialRing(kinds: readonly PuzzleKindDef[]): number {
  return kinds.reduce((deepest, kind) => Math.max(deepest, kind.introducedAtRing), 0);
}
