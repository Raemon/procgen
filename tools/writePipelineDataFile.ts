import { writeFileSync } from 'node:fs';
import '../procgen/nodes/index';
import { volcanicIslands } from '../procgen/presets/volcanicIslands';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';

const OUTPUT_PATH = 'data/pipeline.json';

const state = sanitizePipeline(volcanicIslands().state);
writeFileSync(OUTPUT_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(`wrote "${volcanicIslands().name}" (${state.nodes.length} nodes) to ${OUTPUT_PATH}`);
