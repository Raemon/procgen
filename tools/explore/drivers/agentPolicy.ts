import type { AgentObservation } from '../../../agents/observation';

export interface AgentAction {
  action: string;
  params: Record<string, unknown>;
}

export interface AgentTurnView {
  observation: AgentObservation;
  observationText: string;
  actionsTaken: number;
  lastOutcome: string | null;
  lastFailure: string | null;
}

export interface AgentPolicy {
  name: string;
  decide(view: AgentTurnView): Promise<AgentAction | null>;
}

export interface SeededAgentPolicy {
  name: string;
  forSeed(seed: number): AgentPolicy;
}
