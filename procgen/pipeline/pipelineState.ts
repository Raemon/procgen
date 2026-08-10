import type { DisplayBinding } from '../display/displayBinding';
import type { ParamValue } from '../nodeType';
import { PRESENT } from '../time/worldTime';

export interface NodeInstance {
  id: string;
  type: string;
  label: string;
  comment: string;
  folder: string;
  enabled: boolean;
  params: Record<string, ParamValue>;
  inputs: Record<string, string | null>;
  display: DisplayBinding;
}

export interface PipelineState {
  seed: number;
  daylight: number;
  time: number;
  nodes: NodeInstance[];
}

export const DEFAULT_SEED = 1234;
export const DEFAULT_DAYLIGHT = 1;

export function emptyPipeline(): PipelineState {
  return { seed: DEFAULT_SEED, daylight: DEFAULT_DAYLIGHT, time: PRESENT, nodes: [] };
}

export function clampDaylight(daylight: unknown): number {
  if (typeof daylight !== 'number' || !Number.isFinite(daylight)) return DEFAULT_DAYLIGHT;
  return Math.max(0, Math.min(1, daylight));
}

export function nodeIndexById(state: PipelineState, nodeId: string): number {
  return state.nodes.findIndex((node) => node.id === nodeId);
}
