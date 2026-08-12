import type { CellPoint } from '@/features/game/nearestWalkable';
import type { TileCharacterOf } from '../tileCharacter';
import type { TileIdProbe } from '../worldProbes';
import { shareOf } from './meanOf';
import { postcardsAlongPath } from './viewDistinctness';

const STEPS_BETWEEN_LESSONS = 4;
const WALK_CHAPTERS = 10;

export interface LearningProgress {
  lessonsPer100Steps: number;
  lessonSpread: number;
  lateLessonShare: number;
}

export function learningProgress(
  path: readonly CellPoint[],
  tileIdAt: TileIdProbe,
  characterOf: TileCharacterOf,
): LearningProgress {
  const lessons = firstSightings(
    postcardsAlongPath(path, tileIdAt, characterOf, STEPS_BETWEEN_LESSONS),
  );
  const sightingCount = lessons.length;
  return {
    lessonsPer100Steps: shareOf(sightingCount, path.length) * 100,
    lessonSpread: chapterSpreadOf(lessons, path.length),
    lateLessonShare: shareOf(lateLessonsOf(lessons, path.length), sightingCount),
  };
}

function firstSightings(postcards: readonly string[]): number[] {
  const alreadySeen = new Set<string>();
  const sightingSteps: number[] = [];
  postcards.forEach((postcard, index) => {
    if (alreadySeen.has(postcard)) return;
    alreadySeen.add(postcard);
    sightingSteps.push(index * STEPS_BETWEEN_LESSONS);
  });
  return sightingSteps;
}

function chapterSpreadOf(lessonSteps: readonly number[], pathLength: number): number {
  if (pathLength === 0) return 0;
  const chapters = new Set(
    lessonSteps.map((step) => Math.min(WALK_CHAPTERS - 1, Math.floor((step / pathLength) * WALK_CHAPTERS))),
  );
  return chapters.size / WALK_CHAPTERS;
}

function lateLessonsOf(lessonSteps: readonly number[], pathLength: number): number {
  return lessonSteps.filter((step) => step >= pathLength / 2).length;
}
