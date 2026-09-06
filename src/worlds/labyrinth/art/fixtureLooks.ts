import { fixtureLook, gateLook, type FixtureLook } from '@/features/game/fixtures/fixtureAppearance';
import type { PuzzleFixture } from '@/features/game/fixtures/fixtureKinds';
import type { PuzzleRoomLayout } from '../generate/rooms/puzzleRoomLayout';

export function fixtureLookOf(layout: PuzzleRoomLayout, fixture: PuzzleFixture, done: boolean): FixtureLook {
  if (fixture.kind === 'gate') return gateLook(layout.unlock === 'key' ? 'key' : 'mechanism', done);
  return fixtureLook(fixture.kind, done);
}
