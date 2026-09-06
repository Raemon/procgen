import { cellWithin } from '@/features/game/circuits/circuit';
import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import type { Cell } from '@/features/game/worldRules';
import { everyFixtureOf, type PuzzleRoomLayout } from '../generate/rooms/puzzleRoomLayout';
import { livePosition } from './state/fixtureSignals';
import type { PuzzleState } from './state/puzzleState';

export type GateStandsOpen = (layout: PuzzleRoomLayout, gate: PuzzleFixture) => boolean;

export function fixturesAt(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  x: number,
  y: number,
): PuzzleFixture[] {
  return everyFixtureOf(layout).filter((fixture) => {
    const at = livePosition(layout, state, fixture);
    return at.x === x && at.y === y;
  });
}

export function fixtureAt(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  x: number,
  y: number,
): PuzzleFixture | null {
  const here = fixturesAt(layout, state, x, y);
  return here.find((fixture) => fixture.kind !== 'plate') ?? here[0] ?? null;
}

export function whatBlocksAt(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  x: number,
  y: number,
  gateStandsOpen: GateStandsOpen,
): PuzzleFixture | null {
  const stops = (fixture: PuzzleFixture) => standsInTheWay(layout, fixture, gateStandsOpen);
  return fixturesAt(layout, state, x, y).find(stops) ?? null;
}

function standsInTheWay(
  layout: PuzzleRoomLayout,
  fixture: PuzzleFixture,
  gateStandsOpen: GateStandsOpen,
): boolean {
  if (fixture.kind === 'crate' || fixture.kind === 'pillar') return true;
  return fixture.kind === 'gate' && !gateStandsOpen(layout, fixture);
}

export function crateCellsIn(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Cell[] {
  return layout.fixtures
    .filter((fixture) => fixture.kind === 'crate')
    .map((crate) => livePosition(layout, state, crate))
    .filter((at) => cellWithin(at, minX, minY, maxX, maxY));
}
