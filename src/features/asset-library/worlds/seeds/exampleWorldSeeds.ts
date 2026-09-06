import { contributedWorldSeedCount, examplePipelines } from './examplePipelines';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { WorldSeed } from './worldSeed';

let sanitized: { seeds: WorldSeed[]; contributed: number } | null = null;

export function exampleWorldSeeds(): readonly WorldSeed[] {
  if (!sanitized || sanitized.contributed !== contributedWorldSeedCount()) {
    sanitized = {
      contributed: contributedWorldSeedCount(),
      seeds: examplePipelines().map((example) => ({
        name: example.name,
        description: example.description,
        state: sanitizePipeline(example.state),
      })),
    };
  }
  return sanitized.seeds;
}
