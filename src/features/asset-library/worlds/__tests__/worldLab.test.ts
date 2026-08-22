import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { installRunWorlds, startGradeRun, startRollRun, startTrainRun } from '../lab/labOperations';
import { gradeLimitsOf, trainingSettingsOf } from '../lab/labSettings';
import type { LabRun } from '../lab/labRun';
import { WorldLab } from '../lab/worldLab';
import { READING_BANDS } from '../walkingSim/readingBands';
import { WorldPresetLibrary } from '../presets/worldPresetLibrary';
import { fixtureTileAssets, samplerOfState, variedStructuredState } from './walkingSimFixtures';

const WALK = { step_budget: 120, radius_cap: 60 };

export function checkWorldLab(check: CheckReporter): void {
  checkSettingsAreClamped(check);
  checkGradingTheWorldYouAreIn(check);
  checkRollingRanksByFun(check);
  checkStoppingAndTraining(check);
  checkInstallingWinners(check);
}

function immediateLab(): WorldLab {
  return new WorldLab((task) => task());
}

function checkSettingsAreClamped(check: CheckReporter): void {
  const limits = gradeLimitsOf({ step_budget: 9_000_000, radius_cap: 1 });
  check('a step budget past the ceiling is clamped rather than refused', limits.stepBudget === 5000);
  check('a radius cap under the floor is clamped rather than refused', limits.radiusCap === 20);
  const settings = trainingSettingsOf({});
  check('training settings fall back to defaults when the body names none', settings.generations === 20 && settings.batchSize === 8);
  check('an unseeded run still gets a whole-number seed, so it replays', Number.isInteger(settings.seed));
}

function checkGradingTheWorldYouAreIn(check: CheckReporter): void {
  const lab = immediateLab();
  const run = startGradeRun(
    lab,
    { name: 'fixture', sampler: samplerOfState(variedStructuredState()), tileAssets: fixtureTileAssets },
    WALK,
  );
  check('a grade run finishes and reports the world it walked', run.status === 'done' && run.worlds.length === 1);
  const graded = run.worlds[0]!;
  check('grading scores one fun number between zero and one', graded.grade.fun > 0 && graded.grade.fun <= 1);
  const reported = new Set(graded.grade.readings.map((reading) => reading.name));
  check('grading reports a reading for every band the grader declares', READING_BANDS.every((band) => reported.has(band.name)));
  check('a graded running world carries no genome, because it is not a rolled candidate', graded.genome === null);
  check('the lab remembers a finished run so it can be read back', lab.byId(run.id) === run);
}

function checkRollingRanksByFun(check: CheckReporter): void {
  const lab = immediateLab();
  const run = startRollRun(lab, { ...WALK, count: 3, seed: 4242 });
  check('a roll run walks every world it rolled', run.status === 'done' && run.done === 3);
  check('rolled worlds come back ranked by fun, best first', isDescending(run.worlds.map((world) => world.grade.fun)));
  check('a roll run scores the batch as a batch, not only world by world', run.batch !== null);
  check('every rolled world keeps the genome that made it, so it can be installed', run.worlds.every((world) => world.genome !== null));
  const replay = startRollRun(immediateLab(), { ...WALK, count: 3, seed: 4242 });
  check('the same seed rolls and grades the same worlds', sameFun(run, replay));
}

function checkStoppingAndTraining(check: CheckReporter): void {
  const run = startTrainRun(immediateLab(), { ...WALK, generations: 2, batch_size: 2, seed: 11, patience: 5 });
  check('a training run records a generation at a time', run.trajectory.length >= 1 && run.status === 'done');
  check('training keeps the elites it found as ranked worlds', run.worlds.every((world) => world.genome !== null));

  const queue: (() => void)[] = [];
  const paused = new WorldLab((task) => queue.push(task));
  const stopping = startRollRun(paused, { ...WALK, count: 4, seed: 7 });
  queue.shift()!();
  queue.shift()!();
  check('a run only walks the worlds it has been given time for', stopping.status === 'running' && stopping.done === 2);
  paused.stop(stopping.id);
  queue.shift()!();
  check('a run asked to stop settles as stopped instead of running on', stopping.status === 'stopped' && stopping.finishedAt !== null);
  check('a stopped run keeps what it had already graded', stopping.worlds.length === 2);
  check('a stopped run asks for no more time', queue.length === 0);
}

function checkInstallingWinners(check: CheckReporter): void {
  const lab = immediateLab();
  const run = startRollRun(lab, { ...WALK, count: 2, seed: 909 });
  const library = {
    tileAssets: new TileAssets([]),
    pieces: new PieceAssets([]),
    cultures: new CultureAssets([]),
    worldPresets: new WorldPresetLibrary({ presets: [], hiddenExamples: [] }),
  };
  const installed = installRunWorlds(library, run, 2, new Set());
  check('installing saves one library world per winner', installed.length === run.worlds.length);
  check('an installed world brings the tiles its palette needs', library.tileAssets.all().length > 0);
  check('an installed world brings its own culture, so its buildings still stand', library.cultures.all().length === installed.length);
  check('installed worlds are saved under the names they report', installed.every((each) => library.worldPresets.byName(each.name) !== undefined));

  const clashing = installRunWorlds(library, run, 1, new Set([installed[0]!.name]));
  check('a name already taken is stepped around instead of overwritten', clashing[0]!.name !== installed[0]!.name);
  check('the run remembers everything installed from it', run.installed.length === installed.length + clashing.length);
}

function isDescending(values: readonly number[]): boolean {
  return values.every((value, at) => at === 0 || values[at - 1]! >= value);
}

function sameFun(one: LabRun, other: LabRun): boolean {
  const funs = (run: LabRun) => run.worlds.map((world) => world.grade.fun.toFixed(6)).join(' ');
  return funs(one) === funs(other) && funs(one) !== '';
}
