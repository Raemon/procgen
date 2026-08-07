import { writeFileSync } from 'node:fs';
import '../procgen/nodes/index';
import { emberMarches } from '../procgen/presets/emberMarches';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';

const OUTPUT_PATH = 'data/pipeline.json';

const state = sanitizePipeline(emberMarches().state);
writeFileSync(OUTPUT_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(`wrote "${emberMarches().name}" (${state.nodes.length} nodes) to ${OUTPUT_PATH}`);
