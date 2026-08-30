import type { LabRun, LabWorldSeed } from '../lab/labRun';
import { weakestReadingsOf } from '../lab/worldGrade';

export function runListJson(run: LabRun) {
  return {
    id: run.id,
    kind: run.kind,
    status: run.status,
    started_at: run.startedAt,
    finished_at: run.finishedAt,
    settings: run.settings,
    progress: { done: run.done, total: run.total },
    generations_done: run.generationsDone,
    candidates_done: run.done,
    elites: run.worldSeeds.length,
    coverage: latestCoverageOf(run),
    world_seeds_graded: run.done,
    world_seeds_with_nowhere_to_walk: run.unwalkable,
    best_fun: run.worldSeeds[0]?.grade.fun ?? null,
    error: run.error,
  };
}

export function runDetailJson(run: LabRun) {
  return {
    ...runListJson(run),
    batch: run.batch,
    world_seeds: run.worldSeeds.map(worldSeedJson),
    generations: run.trajectory,
    installed: run.installed,
  };
}

function latestCoverageOf(run: LabRun): number {
  return run.trajectory[run.trajectory.length - 1]?.coverage ?? 0;
}

function worldSeedJson(seed: LabWorldSeed, at: number) {
  return {
    rank: at + 1,
    name: seed.name,
    fun: seed.grade.fun,
    walks_taken: seed.grade.walksTaken,
    weakest_readings: weakestReadingsOf(seed.grade, 5),
    readings: seed.grade.readings,
    measurements: seed.grade.measurements,
    genome: seed.genome,
  };
}
