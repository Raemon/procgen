import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PANEL_SOURCE_ROOTS = ['src/ui', 'src/app', 'src/agent/ui'];
const NATIVE_TITLE_ATTRIBUTE = /\stitle=[{"]/;

const offenders = PANEL_SOURCE_ROOTS.flatMap(componentFilesUnder).filter(usesNativeTitle);

if (offenders.length > 0) {
  console.error('FAIL panel controls must explain themselves with tip={...}, not a native title=');
  for (const file of offenders) console.error(`     ${file}`);
  process.exit(1);
}
console.log(`ok   ${PANEL_SOURCE_ROOTS.join(', ')} explain every control through the tooltip system`);

function componentFilesUnder(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return componentFilesUnder(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

function usesNativeTitle(file: string): boolean {
  return NATIVE_TITLE_ATTRIBUTE.test(readFileSync(file, 'utf8'));
}
