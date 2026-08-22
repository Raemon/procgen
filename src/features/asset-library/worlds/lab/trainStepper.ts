import { TrainingRunner, type TrainingSettings } from '../selfPlay/trainingRunner';
import { rankWorlds, type LabRun, type LabStepper } from './labRun';
import { labWorldOf } from './scoredWorldGrade';

export function trainStepper(settings: TrainingSettings): LabStepper {
  const runner = new TrainingRunner(settings);
  return {
    total: settings.generations,
    step: (run: LabRun) => {
      const record = runner.nextGeneration();
      run.trajectory.push(record);
      run.batch = record.batch;
      run.unwalkable += record.worldsWithNowhereToWalk;
      run.worlds = runner.archive.rankedByFun().map(labWorldOf);
      rankWorlds(run);
      if (runner.hasFinished()) run.total = run.done + 1;
    },
    finish: () => undefined,
  };
}
