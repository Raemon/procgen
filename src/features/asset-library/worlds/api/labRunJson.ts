import type { LabRun, LabWorld } from '../lab/labRun';
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
    worlds_graded: run.worlds.length,
    worlds_with_nowhere_to_walk: run.unwalkable,
    best_fun: run.worlds[0]?.grade.fun ?? null,
    error: run.error,
  };
}

export function runDetailJson(run: LabRun) {
  return {
    ...runListJson(run),
    batch: run.batch,
    worlds: run.worlds.map(worldJson),
    generations: run.trajectory,
    installed: run.installed,
  };
}

function worldJson(world: LabWorld, at: number) {
  return {
    rank: at + 1,
    name: world.name,
    fun: world.grade.fun,
    walks_taken: world.grade.walksTaken,
    weakest_readings: weakestReadingsOf(world.grade, 5),
    readings: world.grade.readings,
    measurements: world.grade.measurements,
    genome: world.genome,
  };
}
