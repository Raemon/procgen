import type { DoorwaySide, RoomRect } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import type { CratePush } from '../kinds/puzzleKind';
import type { RoomItem, RoomUnlock } from './roomItem';

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
  items: RoomItem[];
  unlock: RoomUnlock;
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

export function sideOfGate(layout: PuzzleRoomLayout, gate: PuzzleFixture): DoorwaySide {
  if (layout.gates.east.includes(gate)) return 'east';
  if (layout.gates.west.includes(gate)) return 'west';
  if (layout.gates.north.includes(gate)) return 'north';
  return 'south';
}

export function oppositeSide(side: DoorwaySide): DoorwaySide {
  if (side === 'east') return 'west';
  if (side === 'west') return 'east';
  if (side === 'north') return 'south';
  return 'north';
}

export function roomAcrossTheGate(
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
): { roomX: number; roomY: number } {
  const step = SIDE_STEPS[sideOfGate(layout, gate)];
  return { roomX: layout.roomX + step[0], roomY: layout.roomY + step[1] };
}

const SIDE_STEPS: Record<DoorwaySide, [number, number]> = {
  east: [1, 0],
  west: [-1, 0],
  north: [0, -1],
  south: [0, 1],
};
