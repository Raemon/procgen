import type { Marker } from '@/features/asset-library/worlds/worldSampler';
import { fixtureLookOf } from '../art/fixtureLooks';
import { everyFixtureOf, type PuzzleRoomLayout } from '../generate/rooms/puzzleRoomLayout';
import type { PuzzleWorld } from './puzzleWorld';
import { livePosition } from './state/fixtureSignals';

export function roomMarkersOf(
  puzzles: PuzzleWorld,
  layout: PuzzleRoomLayout,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Marker[] {
  const markers: Marker[] = [];
  for (const fixture of everyFixtureOf(layout)) {
    const at = livePosition(layout, puzzles.state, fixture);
    if (at.x < minX || at.x > maxX || at.y < minY || at.y > maxY) continue;
    const done = puzzles.fixtureReadsAsDone(layout, fixture);
    markers.push({ x: at.x, y: at.y, ...fixtureLookOf(layout, fixture, done) });
  }
  return markers;
}
