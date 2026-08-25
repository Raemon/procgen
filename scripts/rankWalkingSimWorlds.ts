import { join } from 'node:path';
import {
  followLabRun,
  labServerUrl,
  reportWorldsOf,
  startLabRun,
  stopOnInterrupt,
  type LabRunJson,
} from './labClient';
import { RANKING_REPORT_DIR, writeTrainingReport } from './selfPlay/writeTrainingReport';

const ROLL_COUNT = Number(process.argv[2] ?? 12);
const ROLL_SEED = Number(process.argv[3] ?? 20260812);
const STEP_BUDGET = Number(process.argv[4] ?? 350);

let runId: string | null = null;
stopOnInterrupt(() => runId);

runId = await startLabRun('/asset-library/world-seeds/roll', {
  count: ROLL_COUNT,
  seed: ROLL_SEED,
  step_budget: STEP_BUDGET,
  radius_cap: 140,
});
console.log(`rolling ${ROLL_COUNT} worlds on ${labServerUrl()} as ${runId}`);

const run = await followLabRun(runId, (progress) =>
  console.log(`walked ${progress.progress.done}/${progress.progress.total}`),
);
writeTrainingReport(RANKING_REPORT_DIR, reportWorldsOf(run), [], headline(run), false);
printRanking(run);

function headline(run: LabRunJson): string {
  return [
    `${run.world_seeds.length} of ${ROLL_COUNT} rolls walkable`,
    `rng seed ${ROLL_SEED}`,
    `${STEP_BUDGET}-step walks`,
    `batch score ${(run.batch?.overall ?? 0).toFixed(3)}`,
    `diversity ${(run.batch?.diversity ?? 0).toFixed(3)}`,
    `near duplicates ${run.batch?.nearDuplicatePairs ?? 0}`,
  ].join(' · ');
}

function printRanking(run: LabRunJson): void {
  console.log('rank   fun  palette');
  run.world_seeds.forEach((world, position) => {
    console.log(`${String(position + 1).padStart(4)}  ${world.fun.toFixed(3)}  ${world.name}`);
  });
  console.log(`\nbatch: ${headline(run)}`);
  console.log(`report: ${join(RANKING_REPORT_DIR, 'index.html')}`);
  console.log(`run: ${labServerUrl()}/api/v1/asset-library/world-seeds/lab/${run.id}`);
}
