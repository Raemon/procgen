import { mulberry32 } from '../random/mulberry32';
import { batchScore } from '../selfPlay/batchScore';
import { scoredGenome, walkSeedOf, type ScoredWorldSeed } from '../selfPlay/scoreGenome';
import { rolledGenome } from '../selfPlay/worldSeedGenome';
import { touristLimits } from '../walkingSim/touristWalk';
import { rankWorldSeeds, type LabRun, type LabStepper } from './labRun';
import { labWorldSeedsToldApart } from './scoredWorldSeedGrade';
import type { GradeLimits } from './worldGrade';

export function rollStepper(count: number, seed: number, limits: GradeLimits): LabStepper {
  const rng = mulberry32(seed >>> 0);
  const walkLimits = touristLimits(limits.stepBudget, limits.radiusCap);
  const scored: ScoredWorldSeed[] = [];
  return {
    total: count,
    step: (run: LabRun) => {
      const genome = rolledGenome(rng);
      const seed = scoredGenome(genome, walkLimits, walkSeedOf(genome));
      if (!seed) {
        run.unwalkable++;
        return;
      }
      scored.push(seed);
      run.worldSeeds = labWorldSeedsToldApart(scored);
      rankWorldSeeds(run);
    },
    finish: (run: LabRun) => {
      run.batch = batchScore(scored);
    },
  };
}
