import { examplePipelines } from '../procgen/presets/examplePipelines';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import type { WorldPreset } from '../procgen/presets/worldPreset';

let sanitized: WorldPreset[] | null = null;

export function exampleWorlds(): readonly WorldPreset[] {
  sanitized ??= examplePipelines().map((example) => ({
    name: example.name,
    description: example.description,
    state: sanitizePipeline(example.state),
  }));
  return sanitized;
}
