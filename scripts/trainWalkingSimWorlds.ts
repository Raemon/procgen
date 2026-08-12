import '@/features/asset-library/worlds/nodes';
import { join } from 'node:path';
import type { EliteArchive } from '@/features/asset-library/worlds/selfPlay/eliteArchive';
import {
  runTraining,
  type GenerationRecord,
  type TrainingRun,
} from '@/features/asset-library/worlds/selfPlay/trainingLoop';
import { trainingSettingsOf } from './selfPlay/trainingOptions';
import { REPORT_DIR, writeTrainingReport } from './selfPlay/writeTrainingReport';

const settings = trainingSettingsOf(process.argv.slice(2));
const startedAt = Date.now();
const trajectory: GenerationRecord[] = [];

reportRun(runTraining(settings, reportGeneration));

function reportGeneration(record: GenerationRecord, archive: EliteArchive): void {
  trajectory.push(record);
  console.log(generationLine(record));
  writeTrainingReport(archive.rankedByFun(), trajectory, settings, true);
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
    `noSpawn ${record.worldsWithNowhereToWalk}`,
    `${secondsSinceStart()}s`,
  ].join('  ');
}

function reportRun(run: TrainingRun): void {
  writeTrainingReport(run.archive.rankedByFun(), run.trajectory, settings, false);
  console.log(finishedLine(run));
  console.log(`report: ${join(REPORT_DIR, 'index.html')}`);
}

function finishedLine(run: TrainingRun): string {
  const why = run.saturated
    ? `saturated after ${settings.patience} generations without a gain`
    : 'ran out of generations';
  const found = `best fun ${run.archive.bestFun().toFixed(3)}, coverage ${run.archive.coverage().toFixed(2)}, elites ${run.archive.all().length}`;
  return `\n${why}: ${found}, ${secondsSinceStart()}s`;
}

function secondsSinceStart(): number {
  return Math.round((Date.now() - startedAt) / 1000);
}
