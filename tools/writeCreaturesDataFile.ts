import { writeFileSync } from 'node:fs';
import { creaturesAsStoredJson } from '../library/creatures/creatureStorage';
import { defaultCreatures } from '../library/creatures/defaultCreatures';

const OUTPUT_PATH = 'data/creatures.json';

const creatures = creaturesAsStoredJson(defaultCreatures());
writeFileSync(OUTPUT_PATH, `${JSON.stringify(creatures, null, 2)}\n`);
console.log(`wrote ${creatures.length} creatures to ${OUTPUT_PATH}`);
