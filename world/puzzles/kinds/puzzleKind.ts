import type { RandomStream } from '../../../procgen/random/mulberry32';
import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import type { Cell, RoomCells } from './roomCells';

export interface CratePush {
  crateId: string;
  dx: number;
  dy: number;
}

export interface FurnishedRoom {
  fixtures: PuzzleFixture[];
  opensWhen: string[];
  solution: CratePush[];
}

export interface FurnishContext {
  cells: RoomCells;
  level: number;
  entrances: Cell[];
  rng: RandomStream;
}

export interface PuzzleKindDef {
  name: string;
  teachingOrder: number;
  teaches: string;
  furnish(context: FurnishContext): FurnishedRoom;
}

const registry: PuzzleKindDef[] = [];

export function registerPuzzleKind(def: PuzzleKindDef): PuzzleKindDef {
  registry.push(def);
  registry.sort((a, b) => a.teachingOrder - b.teachingOrder);
  return def;
}

export function allPuzzleKinds(): readonly PuzzleKindDef[] {
  return registry;
}

export function nothingToSolve(): FurnishedRoom {
  return { fixtures: [], opensWhen: [], solution: [] };
}
