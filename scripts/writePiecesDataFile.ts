import { writeFileSync } from 'node:fs';
import { defaultPieces } from '@/features/asset-library/pieces/defaultPieces';

const OUTPUT_PATH = 'data/pieces.json';

writeFileSync(OUTPUT_PATH, `${JSON.stringify(defaultPieces(), null, 2)}\n`);
console.log(`wrote ${defaultPieces().length} pieces to ${OUTPUT_PATH}`);
