import type { DisplayBinding } from '../display/displayBinding';
import type { ParamValue } from '../nodeType';

export interface NodeInstance {
  id: string;
  type: string;
  label: string;
  enabled: boolean;
  params: Record<string, ParamValue>;
  inputs: Record<string, string | null>;
  display: DisplayBinding;
}

export interface PipelineState {
  seed: number;
  nodes: NodeInstance[];
}

export const DEFAULT_SEED = 1234;

export function emptyPipeline(): PipelineState {
  return { seed: DEFAULT_SEED, nodes: [] };
}

export function nodeIndexById(state: PipelineState, nodeId: string): number {
  return state.nodes.findIndex((node) => node.id === nodeId);
}
