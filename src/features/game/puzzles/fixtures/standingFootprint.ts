import { gateRunsEastWest, type PuzzleRoomLayout } from '../rooms/puzzleRoomLayout';
import type { FixtureLook } from './fixtureAppearance';
import type { PuzzleFixture } from './puzzleFixture';

export interface StandingFootprint {
  standingFootprint?: readonly [number, number];
}

export function standingFootprintOf(
  layout: PuzzleRoomLayout,
  fixture: PuzzleFixture,
  look: FixtureLook,
): StandingFootprint {
  const thickness = look.standingThickness;
  if (fixture.kind !== 'gate' || thickness === undefined) return {};
  return { standingFootprint: gateRunsEastWest(layout, fixture) ? [thickness, 1] : [1, thickness] };
}
