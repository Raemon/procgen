import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PANEL_SOURCE_ROOTS = ['agents', 'assets', 'frontend', 'procgen', 'world'];
const HINT_COMPONENT_FOLDER = 'frontend/help/';
const PROSE_ELEMENT_STYLED_AS_A_HINT = /<(?:p|span)\s+className=\{[^>]*?HINT_CLASSES/;
const PROSE_ELEMENT_STYLED_AS_A_READOUT = /<(?:p|span)\s+className=\{[^>]*?DIM_READOUT_CLASSES/;

const ALWAYS_VISIBLE_READOUT_SITES = [
  'agents/panel/AgentLogPanel.tsx',
  'assets/cultures/editor/CultureRow.tsx',
  'assets/items/inventoryEditor/InventoryEditor.tsx',
  'procgen/panel/NodeList.tsx',
  'world/panel/PlayerInventoryOverlay.tsx',
];

export function checkPanelHintsRespectTheToggle(
  check: (name: string, condition: boolean) => void,
): void {
  const handWrittenHints = panelComponentsOutsideTheHintComponent().filter((path) =>
    PROSE_ELEMENT_STYLED_AS_A_HINT.test(readFileSync(path, 'utf8')),
  );
  report('panel help written as a bare paragraph instead of PanelHint', handWrittenHints);
  check(
    'every paragraph of panel help renders through PanelHint, so the hints toggle hides all of it',
    handWrittenHints.length === 0,
  );

  const borrowers = panelComponentsOutsideTheHintComponent().filter((path) =>
    readFileSync(path, 'utf8').includes('HINT_CLASSES'),
  );
  report('components reaching for the hint styling directly', borrowers);
  check(
    'the hint styling belongs to PanelHint alone, so no panel can paint help the toggle cannot reach',
    borrowers.length === 0,
  );

  const unlistedReadouts = panelComponentsOutsideTheHintComponent()
    .filter((path) => PROSE_ELEMENT_STYLED_AS_A_READOUT.test(readFileSync(path, 'utf8')))
    .filter((path) => !ALWAYS_VISIBLE_READOUT_SITES.includes(path));
  report('dim prose that is neither a hint nor a listed readout', unlistedReadouts);
  check(
    'only the readouts listed by this check stay dim and always visible, and each one states data',
    unlistedReadouts.length === 0,
  );

  check(
    'every listed readout site still exists, so the allowlist cannot outlive the code it excuses',
    ALWAYS_VISIBLE_READOUT_SITES.every(existsAsFile),
  );
}

function panelComponentsOutsideTheHintComponent(): string[] {
  return PANEL_SOURCE_ROOTS.flatMap(componentFilesUnder).filter(
    (path) => !path.startsWith(HINT_COMPONENT_FOLDER),
  );
}

function componentFilesUnder(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return componentFilesUnder(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

function existsAsFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function report(what: string, offenders: readonly string[]): void {
  if (offenders.length === 0) return;
  console.log(`     ${what}:\n       ${offenders.join('\n       ')}`);
}
