import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { MetricReading } from '../walkingSim/bandScore';
import { measureWalkingSimFun } from '../walkingSim/measureWalkingSimFun';
import { touristLimits } from '../walkingSim/touristWalk';
import type { WalkingSimMeasurements } from '../walkingSim/walkingSimMeasurements';
import type { WorldSampler } from '../worldSampler';

export interface GradeLimits {
  stepBudget: number;
  radiusCap: number;
  walkSeed: number;
}

export interface WorldGrade {
  fun: number;
  readings: MetricReading[];
  measurements: WalkingSimMeasurements;
  walksTaken: number;
}

export const DEFAULT_STEP_BUDGET = 350;
export const DEFAULT_RADIUS_CAP = 140;

export function gradeLimits(
  stepBudget = DEFAULT_STEP_BUDGET,
  radiusCap = DEFAULT_RADIUS_CAP,
  walkSeed = 1,
): GradeLimits {
  return { stepBudget, radiusCap, walkSeed };
}

export function gradeWorld(
  sampler: WorldSampler,
  tileAssets: TileAssets,
  limits: GradeLimits,
): WorldGrade | null {
  const walked = measureWalkingSimFun(
    sampler,
    tileAssets,
    touristLimits(limits.stepBudget, limits.radiusCap),
    limits.walkSeed,
  );
  if (!walked) return null;
  return {
    fun: walked.score.overall,
    readings: walked.score.readings,
    measurements: walked.measurements,
    walksTaken: walked.walksTaken,
  };
}

export function weakestReadingsOf(grade: WorldGrade, count: number): MetricReading[] {
  return [...grade.readings].sort((one, other) => one.score - other.score).slice(0, count);
}

export function gradeSummaryLine(grade: WorldGrade): string {
  const weakest = weakestReadingsOf(grade, 3).map(
    (reading) => `${reading.name} ${reading.value.toFixed(2)} (${reading.score.toFixed(2)})`,
  );
  return `fun ${grade.fun.toFixed(3)} over ${grade.walksTaken} walks; weakest: ${weakest.join(', ')}`;
}
