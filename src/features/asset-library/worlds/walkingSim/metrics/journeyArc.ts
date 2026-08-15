import { cellKey } from '../cellGrid';
import type { TouristTrace } from '../touristWalk';
import { shareOf } from './meanOf';

const WALK_CHAPTERS = 10;
const CHAPTER_GIVES_ABOVE_SHARE = 0.5;

export interface JourneyArc {
  retreadShare: number;
  revealSpread: number;
}

export function journeyArc(trace: TouristTrace): JourneyArc {
  return {
    retreadShare: retreadShareOf(trace),
    revealSpread: revealSpreadOf(trace.revealPerStep),
  };
}

function retreadShareOf(trace: TouristTrace): number {
  const walked = new Set<string>();
  let retrod = 0;
  for (const cell of trace.path) {
    const key = cellKey(cell.x, cell.y);
    if (walked.has(key)) retrod++;
    walked.add(key);
  }
  return shareOf(retrod, trace.path.length - 1);
}

function revealSpreadOf(revealPerStep: readonly number[]): number {
  const totalRevealed = revealPerStep.reduce((sum, revealed) => sum + revealed, 0);
  if (totalRevealed === 0 || revealPerStep.length < WALK_CHAPTERS) return 0;
  const evenShare = totalRevealed / WALK_CHAPTERS;
  const giving = chapterTotalsOf(revealPerStep).filter(
    (chapterTotal) => chapterTotal >= evenShare * CHAPTER_GIVES_ABOVE_SHARE,
  );
  return giving.length / WALK_CHAPTERS;
}

function chapterTotalsOf(revealPerStep: readonly number[]): number[] {
  const totals = Array.from({ length: WALK_CHAPTERS }, () => 0);
  revealPerStep.forEach((revealed, step) => {
    const chapter = Math.min(
      WALK_CHAPTERS - 1,
      Math.floor((step / revealPerStep.length) * WALK_CHAPTERS),
    );
    totals[chapter]! += revealed;
  });
  return totals;
}
