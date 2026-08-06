import type { FacingIndex } from '../world/facing';

export type AgentMode = 'god' | 'character';

export const AGENT_MODES: readonly AgentMode[] = ['god', 'character'];

export interface AgentPose {
  x: number;
  y: number;
  facing: FacingIndex;
}

export function isAgentMode(value: unknown): value is AgentMode {
  return value === 'god' || value === 'character';
}
