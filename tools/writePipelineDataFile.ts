import { writeFileSync } from 'node:fs';
import '../procgen/nodes/index';
import { puzzleLabyrinth } from '../procgen/presets/puzzleLabyrinth';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';

const OUTPUT_PATH = 'data/pipeline.json';

const state = sanitizePipeline(puzzleLabyrinth().state);
writeFileSync(OUTPUT_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(`wrote "${puzzleLabyrinth().name}" (${state.nodes.length} nodes) to ${OUTPUT_PATH}`);
