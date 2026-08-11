import { readFileSync } from 'node:fs';
import { endingIn, filesUnder } from './filesUnder';

const PANEL_SOURCE_ROOTS = ['agents', 'assets', 'frontend', 'library', 'procgen', 'world'];
const NATIVE_TITLE_ATTRIBUTE = /\stitle=[{"]/;

const offenders = PANEL_SOURCE_ROOTS.flatMap((root) => filesUnder(root, endingIn('.tsx'))).filter(
  usesNativeTitle,
);

if (offenders.length > 0) {
  console.error('FAIL panel controls must explain themselves with tip={...}, not a native title=');
  for (const file of offenders) console.error(`     ${file}`);
  process.exit(1);
}
console.log(`ok   ${PANEL_SOURCE_ROOTS.join(', ')} explain every control through the tooltip system`);

function usesNativeTitle(file: string): boolean {
  return NATIVE_TITLE_ATTRIBUTE.test(readFileSync(file, 'utf8'));
}
