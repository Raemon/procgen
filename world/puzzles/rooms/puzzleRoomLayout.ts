import type { RoomRect } from '../../../procgen/nodes/puzzle/puzzleRoomLattice';
import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import type { CratePush } from '../kinds/puzzleKind';

export interface RoomGates {
  east: PuzzleFixture[];
  south: PuzzleFixture[];
}

export interface PuzzleRoomLayout {
  roomX: number;
  roomY: number;
  key: string;
  interior: RoomRect;
  kindName: string;
  level: number;
  entrance: { x: number; y: number };
  fixtures: PuzzleFixture[];
  gates: RoomGates;
  opensWhen: string[];
  solution: CratePush[];
}

export function fixtureIdIn(layout: PuzzleRoomLayout, fixtureId: string): string {
  return `${layout.key}/${fixtureId}`;
}

export function everyFixtureOf(layout: PuzzleRoomLayout): PuzzleFixture[] {
  return [...layout.fixtures, ...layout.gates.east, ...layout.gates.south];
}

export function roomAcrossTheGate(
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
): { roomX: number; roomY: number } {
  return layout.gates.east.includes(gate)
    ? { roomX: layout.roomX + 1, roomY: layout.roomY }
    : { roomX: layout.roomX, roomY: layout.roomY + 1 };
}
