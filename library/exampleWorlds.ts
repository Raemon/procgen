import { examplePipelines } from '../procgen/presets/examplePipelines';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import type { WorldPreset } from '../procgen/presets/worldPreset';

export function exampleWorlds(): WorldPreset[] {
  return examplePipelines().map((example) => ({
    name: example.name,
    description: example.description,
    state: sanitizePipeline(example.state),
  }));
}
