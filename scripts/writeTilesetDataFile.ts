import { writeFileSync } from 'node:fs';
import { defaultTiles } from '../src/world/tiles/defaultTiles';

const OUTPUT_PATH = 'data/tileset.json';

writeFileSync(OUTPUT_PATH, `${JSON.stringify(defaultTiles())}\n`);
console.log(`wrote ${defaultTiles().length} tiles to ${OUTPUT_PATH}`);
