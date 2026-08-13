import '@/features/asset-library/worlds/nodes';
import { join } from 'node:path';
import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';
import { batchScore } from '@/features/asset-library/worlds/selfPlay/batchScore';
import { funOf, scoredGenome, walkSeedOf, type ScoredWorld } from '@/features/asset-library/worlds/selfPlay/scoreGenome';
import { rolledGenome } from '@/features/asset-library/worlds/selfPlay/worldGenome';
import { touristLimits } from '@/features/asset-library/worlds/walkingSim/touristWalk';
import { RANKING_REPORT_DIR, writeTrainingReport } from './selfPlay/writeTrainingReport';

const ROLL_COUNT = Number(process.argv[2] ?? 12);
const ROLL_SEED = Number(process.argv[3] ?? 20260812);
const STEP_BUDGET = Number(process.argv[4] ?? 350);

const rng = mulberry32(ROLL_SEED);
const limits = touristLimits(STEP_BUDGET, 140);
const rolled = Array.from({ length: ROLL_COUNT }, () => rolledGenome(rng));
const walked = rolled
  .map((genome) => scoredGenome(genome, limits, walkSeedOf(genome)))
  .filter((world): world is ScoredWorld => world !== null)
  .sort((one, other) => funOf(other) - funOf(one));

const batch = batchScore(walked);
writeTrainingReport(RANKING_REPORT_DIR, walked, [], headline(), false);
printRanking();

function headline(): string {
  return [
    `${walked.length} of ${ROLL_COUNT} rolls walkable`,
    `rng seed ${ROLL_SEED}`,
    `${STEP_BUDGET}-step walks`,
    `batch score ${batch.overall.toFixed(3)}`,
    `diversity ${batch.diversity.toFixed(3)}`,
    `near duplicates ${batch.nearDuplicatePairs}`,
  ].join(' · ');
}

function printRanking(): void {
  console.log('rank   fun  palette');
  walked.forEach((world, position) => {
    console.log(`${String(position + 1).padStart(4)}  ${funOf(world).toFixed(3)}  ${world.paletteName}`);
  });
  console.log(`\nbatch: ${headline()}`);
  console.log(`report: ${join(RANKING_REPORT_DIR, 'index.html')}`);
}
