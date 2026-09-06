import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import type { KeyPurse } from '@/features/game/fixtures/keyPurse';
import type { UseOutcome } from '@/features/game/fixtures/useOutcome';
import type { DoorwaySide } from '../generate/layout/roomLayout';
import {
  oppositeSide,
  roomAcrossTheGate,
  sideOfGate,
  type PuzzleRoomLayout,
} from '../generate/rooms/puzzleRoomLayout';
import type { RoomAtlas } from './roomAtlas';
import { roomIsSolved } from './state/fixtureSignals';
import type { PuzzleState } from './state/puzzleState';
import { unlockedSideId } from './state/roomKeys';

export function gateStandsOpen(
  atlas: RoomAtlas,
  state: PuzzleState,
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
): boolean {
  const side = sideOfGate(layout, gate);
  if (roomOpensItsSide(state, layout, side)) return true;
  const across = roomAcrossTheGate(layout, gate);
  const neighbour = atlas.inCell(across.roomX, across.roomY);
  return neighbour !== null && roomOpensItsSide(state, neighbour, oppositeSide(side));
}

export function unlockWithKey(
  state: PuzzleState,
  layout: PuzzleRoomLayout,
  gate: PuzzleFixture,
  purse: KeyPurse,
): UseOutcome {
  if (!purse.spendKey()) {
    return { ok: false, code: 'no_key', hint: 'this door wants a key and your bag has none' };
  }
  state.setOn(unlockedSideId(layout, sideOfGate(layout, gate)), true);
  return { ok: true, summary: 'turned the key in the lock; the door swings open' };
}

function roomOpensItsSide(
  state: PuzzleState,
  layout: PuzzleRoomLayout,
  side: DoorwaySide,
): boolean {
  if (layout.gates[side].length === 0) return false;
  if (layout.unlock !== 'key') return roomIsSolved(layout, state);
  return state.isOn(unlockedSideId(layout, side));
}
