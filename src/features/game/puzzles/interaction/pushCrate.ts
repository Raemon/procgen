import { rectContains } from '@/features/asset-library/worlds/labyrinth/roomLayout';
import type { PuzzleFixture } from '../fixtures/puzzleFixture';
import { fixtureIdIn, type PuzzleRoomLayout } from '../rooms/puzzleRoomLayout';
import { livePosition } from '../state/fixtureSignals';
import type { PuzzleState } from '../state/puzzleState';

export type WalkableProbe = (x: number, y: number) => boolean;

export function crateCanBePushed(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  crate: PuzzleFixture,
  dx: number,
  dy: number,
  tileIsWalkable: WalkableProbe,
): boolean {
  if (dx !== 0 && dy !== 0) return false;
  const to = crateWouldLandOn(layout, state, crate, dx, dy);
  if (!rectContains(layout.interior, to.x, to.y)) return false;
  if (!tileIsWalkable(to.x, to.y)) return false;
  return !somethingStandsAt(layout, state, to.x, to.y, crate);
}

export function pushCrate(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  crate: PuzzleFixture,
  dx: number,
  dy: number,
  tileIsWalkable: WalkableProbe,
): boolean {
  if (!crateCanBePushed(layout, state, crate, dx, dy, tileIsWalkable)) return false;
  state.moveCrate(fixtureIdIn(layout, crate.id), crateWouldLandOn(layout, state, crate, dx, dy));
  return true;
}

function crateWouldLandOn(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  crate: PuzzleFixture,
  dx: number,
  dy: number,
): { x: number; y: number } {
  const from = livePosition(layout, state, crate);
  return { x: from.x + dx, y: from.y + dy };
}

function somethingStandsAt(
  layout: PuzzleRoomLayout,
  state: PuzzleState,
  x: number,
  y: number,
  except: PuzzleFixture,
): boolean {
  return layout.fixtures.some((candidate) => {
    if (candidate === except || !standsInTheWay(candidate)) return false;
    const at = livePosition(layout, state, candidate);
    return at.x === x && at.y === y;
  });
}

function standsInTheWay(fixture: PuzzleFixture): boolean {
  return fixture.kind === 'crate' || fixture.kind === 'pillar' || fixture.kind === 'gate';
}
