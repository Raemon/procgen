import { PipelineEvaluator } from '../eval/evaluator';
import type { NodeInstance, PipelineState } from './pipelineState';
import { PipelineStore } from './pipelineStore';

export interface PerturbedWorld {
  seed(): number;
  nodes(): readonly NodeInstance[];
  evaluator: PipelineEvaluator;
}

export interface ParamOverride {
  nodeId: string;
  param: string;
  value: number;
}

export function worldFromState(state: PipelineState, override: ParamOverride | null): PerturbedWorld {
  const store = new PipelineStore(override ? withParamOverride(state, override) : clonedState(state));
  return {
    seed: () => store.seed(),
    nodes: () => store.nodes(),
    evaluator: new PipelineEvaluator(store),
  };
}

function clonedState(state: PipelineState): PipelineState {
  return { seed: state.seed, nodes: state.nodes.map((node) => ({ ...node })) };
}

function withParamOverride(state: PipelineState, override: ParamOverride): PipelineState {
  return {
    seed: state.seed,
    nodes: state.nodes.map((node) =>
      node.id === override.nodeId
        ? { ...node, params: { ...node.params, [override.param]: override.value } }
        : { ...node },
    ),
  };
}
