import { writeFileSync } from 'node:fs';
import '../src/procgen/nodes/index';
import { emberMarches } from '../src/procgen/presets/emberMarches';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';

const OUTPUT_PATH = 'data/pipeline.json';

const state = sanitizePipeline(emberMarches().state);
writeFileSync(OUTPUT_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(`wrote "${emberMarches().name}" (${state.nodes.length} nodes) to ${OUTPUT_PATH}`);
