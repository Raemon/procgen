import type { PipelineEvaluator } from '../../procgen/eval/evaluator';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import type { Tileset } from '../../world/tiles/tileset';

export interface PanelDeps {
  store: PipelineStore;
  tileset: Tileset;
  evaluator: PipelineEvaluator;
}
