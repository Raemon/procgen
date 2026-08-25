import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { WorldSampler } from '../worldSampler';
import type { LabRun, LabStepper } from './labRun';
import { gradeWorld, type GradeLimits } from './worldGrade';

export interface GradeTarget {
  name: string;
  sampler: WorldSampler;
  tileAssets: TileAssets;
}

export function gradeStepper(target: GradeTarget, limits: GradeLimits): LabStepper {
  return {
    total: 1,
    step: (run: LabRun) => {
      const grade = gradeWorld(target.sampler, target.tileAssets, limits);
      if (!grade) {
        run.unwalkable++;
        return;
      }
      run.worldSeeds.push({ name: target.name, grade, genome: null });
    },
    finish: () => undefined,
  };
}
