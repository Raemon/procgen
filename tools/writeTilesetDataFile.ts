import { writeFileSync } from 'node:fs';
import { defaultTiles } from '../library/tiles/defaultTiles';

const OUTPUT_PATH = 'data/tileset.json';

writeFileSync(OUTPUT_PATH, `${JSON.stringify(defaultTiles(), null, 2)}\n`);
console.log(`wrote ${defaultTiles().length} tiles to ${OUTPUT_PATH}`);
