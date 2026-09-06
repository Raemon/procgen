import type { FacingIndex } from '@/features/game/facing';

export type AgentMode = 'god' | 'character' | 'topdown';

export interface AgentPose {
  x: number;
  y: number;
  facing: FacingIndex;
}

export function isAgentMode(value: unknown): value is AgentMode {
  return value === 'god' || value === 'character' || value === 'topdown';
}

export const AGENT_MODES: readonly AgentMode[] = ['god', 'character', 'topdown'];

export function seesTheWholeWindow(mode: AgentMode): boolean {
  return mode === 'god';
}

export function seesByLineOfSight(mode: AgentMode): boolean {
  return mode !== 'god';
}

export function seesAllAround(mode: AgentMode): boolean {
  return mode === 'topdown';
}

export function remembersWhatItHasSeen(mode: AgentMode): boolean {
  return mode === 'topdown';
}
