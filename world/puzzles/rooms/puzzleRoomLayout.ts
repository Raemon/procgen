import type { RoomRect } from '../../../procgen/labyrinth/roomLayout';
import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import type { CratePush } from '../kinds/puzzleKind';

export interface RoomGates {
  east: PuzzleFixture[];
  south: PuzzleFixture[];
  west: PuzzleFixture[];
  north: PuzzleFixture[];
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
  return [...layout.fixtures, ...everyGateOf(layout)];
}

export function everyGateOf(layout: PuzzleRoomLayout): PuzzleFixture[] {
  const { east, south, west, north } = layout.gates;
  return [...east, ...south, ...west, ...north];
}

export function roomAcrossTheGate(
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
): { roomX: number; roomY: number } {
  const step = gateStep(layout, gate);
  return { roomX: layout.roomX + step[0], roomY: layout.roomY + step[1] };
}

function gateStep(layout: PuzzleRoomLayout, gate: PuzzleFixture): [number, number] {
  if (layout.gates.east.includes(gate)) return [1, 0];
  if (layout.gates.west.includes(gate)) return [-1, 0];
  if (layout.gates.north.includes(gate)) return [0, -1];
  return [0, 1];
}
