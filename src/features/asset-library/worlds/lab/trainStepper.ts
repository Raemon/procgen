import { TrainingRunner, type TrainingSettings } from '../selfPlay/trainingRunner';
import { rankWorlds, type LabRun, type LabStepper } from './labRun';
import { labWorldsToldApart } from './scoredWorldGrade';

export function trainStepper(settings: TrainingSettings): LabStepper {
  const runner = new TrainingRunner(settings);
  return {
    total: settings.generations * settings.batchSize,
    step: (run: LabRun) => {
      if (runner.candidatesLeft() === 0) run.trajectory.push(runner.beginGeneration());
      runner.scoreNextCandidate();
      if (runner.candidatesLeft() === 0) closeGeneration(run, runner);
    },
    finish: () => undefined,
  };
}

function closeGeneration(run: LabRun, runner: TrainingRunner): void {
  const record = runner.endGeneration();
  run.trajectory[run.trajectory.length - 1] = record;
  run.generationsDone = record.generation;
  run.batch = record.batch;
  run.unwalkable += record.worldsWithNowhereToWalk;
  run.worlds = labWorldsToldApart(runner.archive.rankedByFun());
  rankWorlds(run);
  if (runner.hasFinished()) run.total = run.done + 1;
}
