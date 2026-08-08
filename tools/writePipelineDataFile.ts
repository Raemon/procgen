import { writeFileSync } from 'node:fs';
import '../procgen/nodes/index';
import { undergroundLabyrinth } from '../procgen/presets/undergroundLabyrinth';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';

const OUTPUT_PATH = 'data/pipeline.json';

const state = sanitizePipeline(undergroundLabyrinth().state);
writeFileSync(OUTPUT_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(`wrote "${undergroundLabyrinth().name}" (${state.nodes.length} nodes) to ${OUTPUT_PATH}`);
