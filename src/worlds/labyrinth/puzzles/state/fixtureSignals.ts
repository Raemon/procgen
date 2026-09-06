import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import { fixtureIdIn, type PuzzleRoomLayout } from '../rooms/puzzleRoomLayout';
import type { PuzzleState } from './puzzleState';

export function livePosition(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  fixture: PuzzleFixture,
): { x: number; y: number } {
  if (fixture.kind !== 'crate') return { x: fixture.x, y: fixture.y };
  return state.crateAt(fixtureIdIn(layout, fixture.id)) ?? { x: fixture.x, y: fixture.y };
}

export function fixtureIsOn(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  fixture: PuzzleFixture,
): boolean {
  if (fixture.kind === 'plate') return crateSitsOn(layout, state, fixture.x, fixture.y);
  if (fixture.kind === 'crate') return crateRestsOnAPlate(layout, state, fixture);
  if (fixture.kind === 'lever') return state.isOn(fixtureIdIn(layout, fixture.id));
  return false;
}

export function signalFixturesOf(layout: PuzzleRoomLayout): PuzzleFixture[] {
  return layout.opensWhen
    .map((id) => layout.fixtures.find((fixture) => fixture.id === id))
    .filter((fixture): fixture is PuzzleFixture => fixture !== undefined);
}

export function roomIsSolved(layout: PuzzleRoomLayout, state: PuzzleState): boolean {
  return unmetSignals(layout, state) === 0;
}

export function unmetSignals(layout: PuzzleRoomLayout, state: PuzzleState): number {
  const met = signalFixturesOf(layout).filter((fixture) => fixtureIsOn(layout, state, fixture)).length;
  return layout.opensWhen.length - met;
}

function crateRestsOnAPlate(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  crate: PuzzleFixture,
): boolean {
  const at = livePosition(layout, state, crate);
  return layout.fixtures.some(
    (candidate) => candidate.kind === 'plate' && candidate.x === at.x && candidate.y === at.y,
  );
}

function crateSitsOn(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  x: number,
  y: number,
): boolean {
  return layout.fixtures.some((candidate) => {
    if (candidate.kind !== 'crate') return false;
    const at = livePosition(layout, state, candidate);
    return at.x === x && at.y === y;
  });
}
