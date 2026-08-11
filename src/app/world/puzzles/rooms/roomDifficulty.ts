import type { RandomStream } from '../../../procgen/random/mulberry32';
import { allPuzzleKinds, type PuzzleKindDef } from '../kinds/puzzleKind';

export interface RoomChallenge {
  kind: PuzzleKindDef | null;
  level: number;
}

export function roomRing(roomX: number, roomY: number): number {
  return Math.max(Math.abs(roomX), Math.abs(roomY));
}

export function challengeForRing(
  ring: number,
  tutorialRings: number,
  rng: RandomStream,
): RoomChallenge {
  const kinds = allPuzzleKinds();
  if (ring === 0 || kinds.length === 0) return { kind: null, level: 0 };
  const taught = kinds.filter((kind) => introductionRing(kinds, kind, tutorialRings) <= ring);
  if (taught.length === 0) return { kind: null, level: 0 };
  const newest = taught[taught.length - 1]!;
  if (introductionRing(kinds, newest, tutorialRings) === ring) return { kind: newest, level: 0 };
  const kind = taught[Math.floor(rng() * taught.length)]!;
  return { kind, level: Math.max(0, ring - tutorialSpan(tutorialRings)) };
}

export function introductionRing(
  kinds: readonly PuzzleKindDef[],
  kind: PuzzleKindDef,
  tutorialRings: number,
): number {
  const span = tutorialSpan(tutorialRings);
  return 1 + Math.floor((kinds.indexOf(kind) * span) / kinds.length);
}

export function tutorialSpan(tutorialRings: number): number {
  return Math.max(1, Math.round(tutorialRings));
}
