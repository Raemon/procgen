import { writeFileSync } from 'node:fs';
import '@/features/asset-library/worlds/nodes';
import { volcanicIslands } from '@/features/asset-library/worlds/seeds/volcanicIslands';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';

const OUTPUT_PATH = 'data/pipeline.json';

const state = sanitizePipeline(volcanicIslands().state);
writeFileSync(OUTPUT_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(`wrote "${volcanicIslands().name}" (${state.nodes.length} nodes) to ${OUTPUT_PATH}`);
