import { readFileSync } from 'node:fs';
import { endingIn, filesUnder } from './filesUnder';
import { reportOffenders } from './reportOffenders';

const PANEL_SOURCE_ROOTS = ['agents', 'assets', 'frontend', 'procgen', 'world'];
const HINT_COMPONENT_FOLDER = 'frontend/help/';
const DIM_TEXT_STYLINGS = ['HINT_CLASSES', 'DIM_READOUT_CLASSES'];

const ALWAYS_VISIBLE_DIM_TEXT_SITES = [
  'agents/panel/AgentLogPanel.tsx',
  'agents/panel/AgentsPanel.tsx',
  'assets/characters/editor/CharacterSpritesEditor.tsx',
  'assets/cultures/editor/CultureRow.tsx',
  'assets/items/inventoryEditor/InventoryEditor.tsx',
  'procgen/panel/NodeList.tsx',
  'world/panel/PlayerInventoryOverlay.tsx',
];

export function checkPanelHintsRespectTheToggle(
  check: (name: string, condition: boolean) => void,
): void {
  const unlisted = panelComponentsPaintingDimText().filter(
    (path) => !ALWAYS_VISIBLE_DIM_TEXT_SITES.includes(path),
  );
  reportOffenders('dim text the hints toggle cannot reach', unlisted);
  check(
    'dim text outside PanelHint is listed here, and each listed site states a value or an empty panel instead of explaining anything',
    unlisted.length === 0,
  );

  const stale = ALWAYS_VISIBLE_DIM_TEXT_SITES.filter((path) => !paintsDimText(path));
  reportOffenders('listed sites that no longer paint dim text of their own', stale);
  check(
    'every listed dim-text site still paints dim text, so the allowlist cannot outlive the code it excuses',
    stale.length === 0,
  );
}

function panelComponentsPaintingDimText(): string[] {
  return PANEL_SOURCE_ROOTS.flatMap((root) => filesUnder(root, endingIn('.tsx')))
    .filter((path) => !path.startsWith(HINT_COMPONENT_FOLDER))
    .filter(paintsDimText);
}

function paintsDimText(path: string): boolean {
  const source = sourceOf(path);
  return DIM_TEXT_STYLINGS.some((styling) => source.includes(styling));
}

function sourceOf(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}
