import { examplePipelines } from './examplePipelines';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { WorldPreset } from './worldPreset';

let sanitized: WorldPreset[] | null = null;

export function exampleWorlds(): readonly WorldPreset[] {
  sanitized ??= examplePipelines().map((example) => ({
    name: example.name,
    description: example.description,
    state: sanitizePipeline(example.state),
  }));
  return sanitized;
}
