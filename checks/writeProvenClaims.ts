import { writeFileSync } from 'node:fs';
import { provenClaims } from './claimRegistry';

const OUTPUT_PATH = 'data/provenClaims.json';

export function writeProvenClaims(): void {
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(provenClaims(), null, 2)}\n`);
}
