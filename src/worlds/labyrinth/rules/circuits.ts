import { cellKeyOf, type Circuit } from '@/features/game/circuits/circuit';
import { routeWires } from '@/features/game/circuits/wireRoutes';
import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import type { Cell } from '@/features/game/worldRules';
import { rectContains } from '../generate/layout/roomLayout';
import { everyGateOf, type PuzzleRoomLayout } from '../generate/rooms/puzzleRoomLayout';
import type { WalkableProbe } from '../play/pushCrate';
import type { PuzzleWorld } from './puzzleWorld';
import { fixtureIsOn, roomIsSolved, signalFixturesOf } from './state/fixtureSignals';

export function roomCircuitOf(puzzles: PuzzleWorld, layout: PuzzleRoomLayout): Circuit | null {
  const gates = everyGateOf(layout);
  const signals = signalFixturesOf(layout);
  if (layout.unlock === 'key' || gates.length === 0 || signals.length === 0) return null;
  return {
    key: `${puzzles.nodeId}:${layout.key}`,
    plates: signals.map((fixture) => ({ x: fixture.x, y: fixture.y, lit: fixtureIsOn(layout, puzzles.state, fixture) })),
    doors: gates.map((gate) => ({ x: gate.x, y: gate.y, open: puzzles.gateIsOpen(layout, gate) })),
    wires: puzzles.wiresOf(layout, signals, gates),
    powered: roomIsSolved(layout, puzzles.state),
  };
}

export function routedWiresOf(
  layout: PuzzleRoomLayout,
  signals: PuzzleFixture[],
  gates: PuzzleFixture[],
  tileIsWalkable: WalkableProbe,
): Cell[] {
  const pillars = new Set(layout.fixtures.filter((fixture) => fixture.kind === 'pillar').map(cellKeyOf));
  const isFloor = (x: number, y: number) =>
    rectContains(layout.interior, x, y) && !pillars.has(cellKeyOf({ x, y })) && tileIsWalkable(x, y);
  return routeWires(signals, gates, isFloor);
}
