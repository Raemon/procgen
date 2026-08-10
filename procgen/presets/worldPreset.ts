import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { PipelineState } from '../pipeline/pipelineState';

export interface WorldPreset {
  name: string;
  description: string;
  state: PipelineState;
}

export function sanitizeWorldPreset(raw: unknown): WorldPreset | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as { name?: unknown; description?: unknown; state?: unknown };
  if (typeof candidate.name !== 'string' || candidate.name.trim() === '') return null;
  const state = sanitizePipeline(candidate.state);
  if (state.nodes.length === 0) return null;
  return {
    name: candidate.name.trim(),
    description: typeof candidate.description === 'string' ? candidate.description : '',
    state,
  };
}

export function sanitizeWorldPresets(raw: unknown): WorldPreset[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeWorldPreset).filter((preset): preset is WorldPreset => preset !== null);
}
