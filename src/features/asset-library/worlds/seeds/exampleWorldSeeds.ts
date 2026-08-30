import { generatedWorldSeeds } from '../../generation/generatedAssets';
import { examplePipelines } from './examplePipelines';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { WorldSeed } from './worldSeed';

let sanitized: WorldSeed[] | null = null;

export function exampleWorldSeeds(): readonly WorldSeed[] {
  sanitized ??= [
    ...examplePipelines().map((example) => ({
      name: example.name,
      description: example.description,
      state: sanitizePipeline(example.state),
    })),
    ...generatedWorldSeeds,
  ];
  return sanitized;
}
