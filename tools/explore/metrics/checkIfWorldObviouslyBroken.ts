import type { WorldMeasurements } from './worldMeasurements';

const MIN_INTERESTING_REGION_CELLS = 300;
const EXPLORABLE_CELLS_FOR_FULL_CREDIT = 2000;
const SEALED_POCKET_SCORE_FLOOR = 0.2;

export interface BrokenWorldFinding {
  claim: string;
  habitability: number;
}

export interface BrokenWorldVerdict {
  findings: BrokenWorldFinding[];
  habitability: number;
}

export function checkIfWorldObviouslyBroken(m: WorldMeasurements): BrokenWorldVerdict {
  return verdictFrom([
    theExploredRegionIsTooSmall(m),
    theExploredRegionIsASealedPocket(m),
  ]);
}

function theExploredRegionIsTooSmall(m: WorldMeasurements): BrokenWorldFinding | null {
  const habitability = Math.min(1, m.uniqueCells / MIN_INTERESTING_REGION_CELLS);
  if (habitability >= 1) return null;
  return {
    claim: `only ${m.uniqueCells} cells were reachable, short of the ${MIN_INTERESTING_REGION_CELLS} it takes to be worth walking`,
    habitability,
  };
}

function theExploredRegionIsASealedPocket(m: WorldMeasurements): BrokenWorldFinding | null {
  if (!m.regionExhausted) return null;
  const habitability = Math.min(
    1,
    Math.max(SEALED_POCKET_SCORE_FLOOR, m.uniqueCells / EXPLORABLE_CELLS_FOR_FULL_CREDIT),
  );
  if (habitability >= 1) return null;
  return {
    claim: `the walk ran out of anywhere new after ${m.uniqueCells} cells, so this is a pocket rather than a world`,
    habitability,
  };
}

function verdictFrom(findings: (BrokenWorldFinding | null)[]): BrokenWorldVerdict {
  const found = findings.filter(isFinding);
  return { findings: found, habitability: found.reduce(timesHabitability, 1) };
}

function isFinding(finding: BrokenWorldFinding | null): finding is BrokenWorldFinding {
  return finding !== null;
}

function timesHabitability(total: number, finding: BrokenWorldFinding): number {
  return total * finding.habitability;
}
