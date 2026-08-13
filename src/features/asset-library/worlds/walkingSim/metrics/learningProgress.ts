import type { CellPoint } from '@/features/game/nearestWalkable';
import type { CellCharacterProbe } from '../cellCharacter';
import { shareOf } from './meanOf';
import { postcardsAlongPath } from './viewDistinctness';

const STEPS_BETWEEN_LESSONS = 4;
const WALK_CHAPTERS = 10;
const NOISE_STARTS_ABOVE_NEW_PAIR_SHARE = 0.4;
const ORIENTATION_STEPS = 24;
const FEWEST_PAIRS_THAT_MEAN_LEARNING = 8;

export interface LearningProgress {
  lessonsPer100Steps: number;
  lessonSpread: number;
  graspableLessonShare: number;
}

interface Lesson {
  step: number;
  newPairCount: number;
  newPairShare: number;
}

export function learningProgress(
  path: readonly CellPoint[],
  characterAt: CellCharacterProbe,
): LearningProgress {
  const lessons = lessonsAmong(postcardsAlongPath(path, characterAt, STEPS_BETWEEN_LESSONS));
  return {
    lessonsPer100Steps: shareOf(lessons.length, path.length) * 100,
    lessonSpread: chapterSpreadOf(lessons, path.length),
    graspableLessonShare: graspableNewPairMassShare(lessons),
  };
}

function graspableNewPairMassShare(lessons: readonly Lesson[]): number {
  const afterOrientation = lessons.filter((lesson) => lesson.step >= ORIENTATION_STEPS);
  if (massOf(afterOrientation) < FEWEST_PAIRS_THAT_MEAN_LEARNING) return 0;
  const graspableMass = massOf(afterOrientation.filter(isGraspable));
  return shareOf(graspableMass, massOf(afterOrientation));
}

function massOf(lessons: readonly Lesson[]): number {
  return lessons.reduce((sum, lesson) => sum + lesson.newPairCount, 0);
}

function isGraspable(lesson: Lesson): boolean {
  return lesson.newPairShare <= NOISE_STARTS_ABOVE_NEW_PAIR_SHARE;
}

function lessonsAmong(postcards: readonly string[]): Lesson[] {
  const knownPairs = new Set<string>();
  const lessons: Lesson[] = [];
  postcards.forEach((postcard, index) => {
    const pairs = characterPairsOf(postcard);
    const newPairs = pairs.filter((pair) => !knownPairs.has(pair));
    if (newPairs.length > 0) {
      lessons.push(lessonOf(index, newPairs.length, pairs.length));
    }
    for (const pair of newPairs) knownPairs.add(pair);
  });
  return lessons;
}

function lessonOf(index: number, newPairCount: number, pairCount: number): Lesson {
  return {
    step: index * STEPS_BETWEEN_LESSONS,
    newPairCount,
    newPairShare: shareOf(newPairCount, pairCount),
  };
}

function characterPairsOf(postcard: string): string[] {
  const characters = postcard.split(',');
  const pairs: string[] = [];
  for (let at = 0; at + 1 < characters.length; at++) {
    pairs.push(`${characters[at]}|${characters[at + 1]}`);
  }
  return pairs;
}

function chapterSpreadOf(lessons: readonly Lesson[], pathLength: number): number {
  if (pathLength === 0) return 0;
  const chapters = new Set(
    lessons.map((each) =>
      Math.min(WALK_CHAPTERS - 1, Math.floor((each.step / pathLength) * WALK_CHAPTERS)),
    ),
  );
  return chapters.size / WALK_CHAPTERS;
}
