import { EliteArchive } from './eliteArchive';
import { TrainingRunner, type GenerationRecord, type TrainingSettings } from './trainingRunner';

export type { GenerationRecord, TrainingSettings };

export interface TrainingRun {
  archive: EliteArchive;
  trajectory: GenerationRecord[];
  saturated: boolean;
}

export function runTraining(
  settings: TrainingSettings,
  onGeneration: (record: GenerationRecord, archive: EliteArchive) => void,
): TrainingRun {
  const runner = new TrainingRunner(settings);
  while (!runner.hasFinished()) {
    onGeneration(runner.nextGeneration(), runner.archive);
  }
  return {
    archive: runner.archive,
    trajectory: runner.trajectory,
    saturated: runner.hasSaturated(),
  };
}
