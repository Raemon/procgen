import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import { fixtureIdIn, type PuzzleRoomLayout } from '../rooms/puzzleRoomLayout';
import { unmetSignals } from '../state/fixtureSignals';
import type { PuzzleState } from '../state/puzzleState';

export type UseOutcome = { ok: true; summary: string } | { ok: false; code: string; hint: string };

export function useFixture(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  fixture: PuzzleFixture,
): UseOutcome {
  if (fixture.kind === 'lever') return latchOn(layout, state, fixture, 'pulled the lever');
  if (fixture.kind === 'crate') {
    return { ok: false, code: 'push_it_instead', hint: 'a crate moves by being walked into' };
  }
  return { ok: false, code: 'nothing_happens', hint: `the ${fixture.kind} does not respond` };
}

function latchOn(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  fixture: PuzzleFixture,
  did: string,
): UseOutcome {
  const id = fixtureIdIn(layout, fixture.id);
  if (state.isOn(id)) return { ok: false, code: 'already_done', hint: `you already ${did}` };
  state.setOn(id, true);
  return { ok: true, summary: `${did}; ${doorReport(layout, state)}` };
}

export function reportDoor(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  isOpen: boolean,
): UseOutcome {
  return isOpen
    ? { ok: true, summary: 'the door stands open' }
    : { ok: false, code: 'door_is_locked', hint: doorReport(layout, state) };
}

function doorReport(layout: PuzzleRoomLayout, state: PuzzleState): string {
  const left = unmetSignals(layout, state);
  if (left === 0) return "this room's doors are open";
  return `${left} more of this room's ${layout.kindName} still to do`;
}
