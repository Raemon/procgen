import { CHUNK_SIZE, chunkCoordOfCell } from '../../../procgen/chunk';
import type { PipelineEvaluator } from '../../../procgen/eval/evaluator';
import type { Feature } from '../../../procgen/features/feature';
import { featuresInRect, type FeaturePipeline } from '../../../procgen/features/featuresInRect';
import type { WorldRect } from '../../../procgen/values/pointsInRect';

export interface SurveyedPipeline extends FeaturePipeline {
  onChange(listener: () => void): () => void;
}

export class SurveyedFeatures {
  private features: Feature[] = [];
  private surveyKey = '';
  private storeRevision = 0;

  constructor(
    private readonly store: SurveyedPipeline,
    private readonly evaluator: PipelineEvaluator,
  ) {
    store.onChange(() => this.storeRevision++);
  }

  featuresFor(rect: WorldRect): Feature[] {
    const aligned = chunkAlignedRectOf(rect);
    const key = `${aligned.minX},${aligned.minY},${aligned.maxX},${aligned.maxY}|${this.storeRevision}`;
    if (key !== this.surveyKey) this.resurvey(key, aligned);
    return this.features;
  }

  private resurvey(key: string, aligned: WorldRect): void {
    this.features = featuresInRect(this.store, this.evaluator, aligned);
    this.surveyKey = key;
  }
}

export function chunkAlignedRectOf(rect: WorldRect): WorldRect {
  return {
    minX: chunkCoordOfCell(rect.minX) * CHUNK_SIZE,
    minY: chunkCoordOfCell(rect.minY) * CHUNK_SIZE,
    maxX: chunkCoordOfCell(rect.maxX) * CHUNK_SIZE + CHUNK_SIZE - 1,
    maxY: chunkCoordOfCell(rect.maxY) * CHUNK_SIZE + CHUNK_SIZE - 1,
  };
}
