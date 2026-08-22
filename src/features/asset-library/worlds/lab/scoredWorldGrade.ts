import { hashString } from '../random/hashString';
import type { ScoredWorld } from '../selfPlay/scoreGenome';
import { genomeAsJson } from '../selfPlay/worldGenome';
import { WALKS_PER_WORLD } from '../walkingSim/measureWalkingSimFun';
import type { LabWorld } from './labRun';

export function labWorldOf(scored: ScoredWorld): LabWorld {
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

export function labWorldsToldApart(scored: readonly ScoredWorld[]): LabWorld[] {
  const shared = namesUsedTwice(scored);
  return scored.map((world) => {
    const world0 = labWorldOf(world);
    if (!shared.has(world.paletteName)) return world0;
    return { ...world0, name: `${world.paletteName} ${genomeTagOf(world)}` };
  });
}

function namesUsedTwice(scored: readonly ScoredWorld[]): Set<string> {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const world of scored) {
    if (seen.has(world.paletteName)) twice.add(world.paletteName);
    seen.add(world.paletteName);
  }
  return twice;
}

function genomeTagOf(scored: ScoredWorld): string {
  return hashString(genomeAsJson(scored.genome)).toString(36).slice(0, 4);
}
