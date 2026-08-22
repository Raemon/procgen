import { mulberry32 } from '../random/mulberry32';
import { batchScore } from '../selfPlay/batchScore';
import { scoredGenome, walkSeedOf, type ScoredWorld } from '../selfPlay/scoreGenome';
import { rolledGenome } from '../selfPlay/worldGenome';
import { touristLimits } from '../walkingSim/touristWalk';
import { rankWorlds, type LabRun, type LabStepper } from './labRun';
import { labWorldsToldApart } from './scoredWorldGrade';
import type { GradeLimits } from './worldGrade';

export function rollStepper(count: number, seed: number, limits: GradeLimits): LabStepper {
  const rng = mulberry32(seed >>> 0);
  const walkLimits = touristLimits(limits.stepBudget, limits.radiusCap);
  const scored: ScoredWorld[] = [];
  return {
    total: count,
    step: (run: LabRun) => {
      const genome = rolledGenome(rng);
      const world = scoredGenome(genome, walkLimits, walkSeedOf(genome));
      if (!world) {
        run.unwalkable++;
        return;
      }
      scored.push(world);
      run.worlds = labWorldsToldApart(scored);
      rankWorlds(run);
    },
    finish: (run: LabRun) => {
      run.batch = batchScore(scored);
    },
  };
}
