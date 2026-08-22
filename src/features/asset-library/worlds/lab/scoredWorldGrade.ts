import type { ScoredWorld } from '../selfPlay/scoreGenome';
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
