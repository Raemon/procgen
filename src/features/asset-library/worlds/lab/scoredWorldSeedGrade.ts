import { hashString } from '../random/hashString';
import type { ScoredWorldSeed } from '../selfPlay/scoreGenome';
import { genomeAsJson } from '../selfPlay/worldSeedGenome';
import { WALKS_PER_WORLD } from '../walkingSim/measureWalkingSimFun';
import type { LabWorldSeed } from './labRun';

export function labWorldSeedOf(scored: ScoredWorldSeed): LabWorldSeed {
  return {
    name: scored.paletteName,
    genome: scored.genome,
    grade: {
      fun: scored.score.overall,
      readings: scored.score.readings,
      measurements: scored.measurements,
      walksTaken: WALKS_PER_WORLD,
    },
  };
}

export function labWorldSeedsToldApart(scored: readonly ScoredWorldSeed[]): LabWorldSeed[] {
  const shared = namesUsedTwice(scored);
  return scored.map((seed) => {
    const seed0 = labWorldSeedOf(seed);
    if (!shared.has(seed.paletteName)) return seed0;
    return { ...seed0, name: `${seed.paletteName} ${genomeTagOf(seed)}` };
  });
}

function namesUsedTwice(scored: readonly ScoredWorldSeed[]): Set<string> {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const seed of scored) {
    if (seen.has(seed.paletteName)) twice.add(seed.paletteName);
    seen.add(seed.paletteName);
  }
  return twice;
}

function genomeTagOf(scored: ScoredWorldSeed): string {
  return hashString(genomeAsJson(scored.genome)).toString(36).slice(0, 4);
}
