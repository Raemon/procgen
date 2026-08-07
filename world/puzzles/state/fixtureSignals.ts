import type { PuzzleFixture } from '../fixtures/puzzleFixture';
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
  if (fixture.kind === 'lever' || fixture.kind === 'key') {
    return state.isOn(fixtureIdIn(layout, fixture.id));
  }
  return false;
}

export function roomIsSolved(layout: PuzzleRoomLayout, state: PuzzleState): boolean {
  return layout.opensWhen.every((fixtureId) => signalNamed(layout, state, fixtureId));
}

export function unmetSignals(layout: PuzzleRoomLayout, state: PuzzleState): number {
  return layout.opensWhen.filter((fixtureId) => !signalNamed(layout, state, fixtureId)).length;
}

function signalNamed(layout: PuzzleRoomLayout, state: PuzzleState, fixtureId: string): boolean {
  const fixture = layout.fixtures.find((candidate) => candidate.id === fixtureId);
  return fixture ? fixtureIsOn(layout, state, fixture) : false;
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
