import { writeFileSync } from 'node:fs';
import { creaturesAsStoredJson } from '../src/creatures/creatureStorage';
import { defaultCreatures } from '../src/creatures/defaultCreatures';

const OUTPUT_PATH = 'data/creatures.json';

const creatures = creaturesAsStoredJson(defaultCreatures());
writeFileSync(OUTPUT_PATH, `${JSON.stringify(creatures)}\n`);
console.log(`wrote ${creatures.length} creatures to ${OUTPUT_PATH}`);
