import { writeFileSync } from 'node:fs';
import { defaultTiles } from '@/features/asset-library/tiles/defaultTiles';
import { tilesAsStoredJson } from '@/features/asset-library/tiles/tileStorage';

const OUTPUT_PATH = 'data/tiles.json';

writeFileSync(OUTPUT_PATH, `${JSON.stringify(tilesAsStoredJson(defaultTiles()), null, 2)}\n`);
console.log(`wrote ${defaultTiles().length} tiles to ${OUTPUT_PATH}`);
