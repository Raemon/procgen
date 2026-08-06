import type { AgentMode } from '../agentMode';

export interface RosterAgent {
  id: string;
  name: string;
  mode: AgentMode;
  position: { x: number; y: number };
  last_action: { action: string; outcome: string } | null;
  run_status: 'idle' | 'running' | 'stopped' | 'finished' | 'error';
  run_goal: string | null;
  run_steps: number;
  run_budget_usd: number | null;
  run_spent_usd: number | null;
  created_at: number;
}

export interface WireTranscriptEntry {
  seq: number;
  type: 'status' | 'thinking' | 'message' | 'tool_use' | 'tool_result' | 'error';
  text: string;
}

export interface RunRequest {
  goal: string;
  model: string;
  maxSteps: number;
  budgetUsd: number;
  apiKey: string | null;
}

export async function fetchAgents(): Promise<RosterAgent[]> {
  const response = await fetch('/api/v1/agents');
  if (!response.ok) return [];
  return ((await response.json()) as { agents: RosterAgent[] }).agents;
}

export async function createAgent(mode: AgentMode, name: string): Promise<void> {
  await fetch('/api/v1/agents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(name === '' ? { mode } : { mode, name }),
  });
}

export async function deleteAgent(id: string): Promise<void> {
  await fetch(`/api/v1/agents/${id}`, { method: 'DELETE' });
}

export async function startRun(id: string, run: RunRequest): Promise<void> {
  await fetch(`/api/v1/agents/${id}/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      goal: run.goal,
      model: run.model,
      max_steps: run.maxSteps,
      budget_usd: run.budgetUsd,
      anthropic_api_key: run.apiKey ?? undefined,
    }),
  });
}

export async function stopRun(id: string): Promise<void> {
  await fetch(`/api/v1/agents/${id}/stop`, { method: 'POST' });
}

export async function fetchTranscript(
  id: string,
  after: number,
): Promise<{ run_status: string; entries: WireTranscriptEntry[] } | null> {
  const response = await fetch(`/api/v1/agents/${id}/transcript?after=${after}`);
  if (!response.ok) return null;
  return (await response.json()) as { run_status: string; entries: WireTranscriptEntry[] };
}
