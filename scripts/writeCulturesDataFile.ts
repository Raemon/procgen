import { writeFileSync } from 'node:fs';
import { defaultCultures } from '../assets/cultures/defaultCultures';

const OUTPUT_PATH = 'data/cultures.json';

writeFileSync(OUTPUT_PATH, `${JSON.stringify(defaultCultures(), null, 2)}\n`);
console.log(`wrote ${defaultCultures().length} cultures to ${OUTPUT_PATH}`);
