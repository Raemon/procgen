import { join } from 'node:path';
import type { GenerationRecord } from '@/features/asset-library/worlds/selfPlay/trainingRunner';
import {
  followLabRun,
  labServerUrl,
  reportWorldsOf,
  startLabRun,
  stopOnInterrupt,
  type LabRunJson,
} from './labClient';
import { trainingSettingsOf } from './selfPlay/trainingOptions';
import { TRAINING_REPORT_DIR, writeTrainingReport } from './selfPlay/writeTrainingReport';

const settings = trainingSettingsOf(process.argv.slice(2));
const startedAt = Date.now();

let runId: string | null = null;
stopOnInterrupt(() => runId);

runId = await startLabRun('/asset-library/world-seeds/train', {
  generations: settings.generations,
  batch_size: settings.batchSize,
  step_budget: settings.stepBudget,
  radius_cap: settings.radiusCap,
  seed: settings.seed,
  patience: settings.patience,
});
console.log(`breeding worlds on ${labServerUrl()} as ${runId}`);

reportRun(await followLabRun(runId, reportGeneration));

let generationsPrinted = 0;

function reportGeneration(run: LabRunJson): void {
  for (const record of run.generations.slice(generationsPrinted)) console.log(generationLine(record));
  generationsPrinted = run.generations.length;
  writeTrainingReport(TRAINING_REPORT_DIR, reportWorldsOf(run), run.generations, headlineOf(run), true);
}

function generationLine(record: GenerationRecord): string {
  return [
    `gen ${String(record.generation).padStart(3)}`,
    `best ${record.archiveBestFun.toFixed(3)}`,
    `batch ${record.batch.meanFun.toFixed(3)}`,
    `diversity ${record.batch.diversity.toFixed(3)}`,
    `coverage ${record.coverage.toFixed(2)}`,
    `admitted ${record.admissions}`,
    `dupes ${record.batch.nearDuplicatePairs}`,
    `noSpawn ${record.worldSeedsWithNowhereToWalk}`,
    `${secondsSinceStart()}s`,
  ].join('  ');
}

function reportRun(run: LabRunJson): void {
  writeTrainingReport(TRAINING_REPORT_DIR, reportWorldsOf(run), run.generations, headlineOf(run), false);
  console.log(finishedLine(run));
  console.log(`report: ${join(TRAINING_REPORT_DIR, 'index.html')}`);
  console.log(`run: ${labServerUrl()}/api/v1/asset-library/world-seeds/lab/${run.id}`);
}

function headlineOf(run: LabRunJson): string {
  return [
    `${run.generations.length} of ${settings.generations} generations`,
    `batch ${settings.batchSize}`,
    `${settings.stepBudget}-step walks`,
    `seed ${settings.seed}`,
    `generated ${new Date().toISOString()}`,
  ].join(' · ');
}

function finishedLine(run: LabRunJson): string {
  const why =
    run.status === 'stopped'
      ? 'stopped'
      : run.generations.length < settings.generations
        ? `saturated after ${settings.patience} generations without a gain`
        : 'ran out of generations';
  const found = `best fun ${(run.best_fun ?? 0).toFixed(3)}, elites ${run.worlds.length}`;
  return `\n${why}: ${found}, ${secondsSinceStart()}s`;
}

function secondsSinceStart(): number {
  return Math.round((Date.now() - startedAt) / 1000);
}
