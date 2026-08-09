import { readFileSync } from 'node:fs';
import { endingIn, filesUnder } from './filesUnder';

globalThis.fetch = async () => new Response(null, { status: 204 });
delete (globalThis as { localStorage?: unknown }).localStorage;

const { isBoolean, isNumber, isNumberOrNull, isOneOf, isRecordOf, isStringArray } = await import(
  '../frontend/uiState/persistedUiGuards'
);
const { readPersistedFile, seedPersistedFile } = await import(
  '../frontend/persistence/repoFileStore'
);
const { persistedUiValue, subscribeToPersistedUiValue, writePersistedUiValue } = await import(
  '../frontend/uiState/persistedUiStore'
);
const { toggledMembers } = await import('../frontend/uiState/toggledMembers');
const { PERSISTED_UI_KEYS } = await import('../frontend/uiState/persistedUiKeys');
const { ITEM_PANELS } = await import('../assets/items/editor/itemPanels');
const { CREATURE_PANELS } = await import('../assets/creatures/editor/creaturePanels');

const ASSET_KINDS = ['tiles', 'pieces', 'creatures'] as const;
const ASSET_EDITOR_ROOT = 'assets';
const DRAWER_STATE_IN_A_BARE_USE_STATE = /const \[[^\]]*(?:open|Open|panel|Panel)[^\]]*\] = useState/;
const POPUPS_THAT_SHOULD_NOT_SURVIVE_A_RELOAD = ['assets/tiles/editor/SymbolInput.tsx'];

checkAToggleReachesTheUiStateDoc();
checkTheNextLoadReadsWhatTheDocHolds();
checkADocHoldingTheWrongShapeFallsBackToTheDefault();
checkEveryReaderOfAKeySeesAWrite();
checkTogglingAMemberAddsThenRemovesIt();
checkCollapsingEveryCardReplacesWhateverWasCollapsed();
checkGuardsAcceptOnlyTheShapesTheUiPersists();
checkNoAssetEditorKeepsItsOpenDrawerToItself();
checkTheOpenItemPanelSurvivesTheNextLoad();
checkTheOpenBackdropDrawerSurvivesTheNextLoad();
checkADrawerNamingAPanelThatIsGoneOpensNothing();
console.log('persisted ui state: all checks passed');

function checkAToggleReachesTheUiStateDoc(): void {
  writePersistedUiValue('panel.collapsed', toggledMembers([], 'library'));
  assert(
    JSON.stringify(storedUiState()['panel.collapsed']) === '["library"]',
    'collapsing a panel writes it into the uiState doc the server persists',
  );
  assert(
    (globalThis as { localStorage?: unknown }).localStorage === undefined,
    'the layout persists with no localStorage in the browser at all',
  );
}

function checkTheNextLoadReadsWhatTheDocHolds(): void {
  seedUiState({ 'assets.tab': 'creatures', 'panel.widths': { library: 310 } });
  assert(
    persistedUiValue('assets.tab', 'tiles', isOneOf(ASSET_KINDS)) === 'creatures',
    'the tab selected last session is the tab that opens',
  );
  assert(
    persistedUiValue('panel.widths', {}, isRecordOf(isNumber)).library === 310,
    'a resized panel comes back at the width it was left at',
  );
}

function checkADocHoldingTheWrongShapeFallsBackToTheDefault(): void {
  seedUiState({ 'stale.tab': 'a tab that no longer exists', 'corrupt.widths': 'not a record' });
  assert(
    persistedUiValue('stale.tab', 'tiles', isOneOf(ASSET_KINDS)) === 'tiles',
    'a stored value that fails its guard is replaced by the default',
  );
  assert(
    persistedUiValue('corrupt.widths', { library: 240 }, isRecordOf(isNumber)).library === 240,
    'a uiState doc of the wrong shape does not break the layout',
  );
}

function checkEveryReaderOfAKeySeesAWrite(): void {
  let notifications = 0;
  const unsubscribe = subscribeToPersistedUiValue('collapsedNodeCards', () => (notifications += 1));
  writePersistedUiValue('collapsedNodeCards', ['n1']);
  unsubscribe();
  writePersistedUiValue('collapsedNodeCards', ['n1', 'n2']);
  assert(notifications === 1, 'a reader hears about a write until it unsubscribes, and not after');
}

function checkTogglingAMemberAddsThenRemovesIt(): void {
  const once = toggledMembers([], 'n1');
  assert(once.length === 1 && once[0] === 'n1', 'toggling a member on adds it');
  assert(toggledMembers(once, 'n1').length === 0, 'toggling the same member off removes it');
}

function checkCollapsingEveryCardReplacesWhateverWasCollapsed(): void {
  seedUiState({ collapsedNodeCards: ['n1'] });
  writePersistedUiValue('collapsedNodeCards', ['n1', 'n2', 'n3']);
  assert(
    JSON.stringify(storedUiState().collapsedNodeCards) === '["n1","n2","n3"]',
    'collapsing every card stores the whole set rather than merging with the old one',
  );
}

function checkGuardsAcceptOnlyTheShapesTheUiPersists(): void {
  assert(isBoolean(true) && !isBoolean('true'), 'a boolean guard takes booleans alone');
  assert(isNumberOrNull(null) && isNumberOrNull(3) && !isNumberOrNull('3'), 'a width may be unset');
  assert(isStringArray(['a']) && !isStringArray(['a', 2]), 'a string array holds only strings');
}

function checkNoAssetEditorKeepsItsOpenDrawerToItself(): void {
  const forgetful = assetEditorComponents()
    .filter((path) => !POPUPS_THAT_SHOULD_NOT_SURVIVE_A_RELOAD.includes(path))
    .filter((path) => DRAWER_STATE_IN_A_BARE_USE_STATE.test(readFileSync(path, 'utf8')));
  if (forgetful.length > 0) console.error(`  drawer state left in useState: ${forgetful.join(', ')}`);
  assert(
    forgetful.length === 0,
    'no asset editor remembers which drawer is open in a bare useState, so every drawer survives a reload',
  );
  assert(
    POPUPS_THAT_SHOULD_NOT_SURVIVE_A_RELOAD.every((path) =>
      DRAWER_STATE_IN_A_BARE_USE_STATE.test(readFileSync(path, 'utf8')),
    ),
    'every popup excused from persisting still keeps its own open state, so the excuse list cannot go stale',
  );
}

function checkTheOpenItemPanelSurvivesTheNextLoad(): void {
  const key = PERSISTED_UI_KEYS.openItemPanels;
  seedUiState({ [key]: { '7': 'knobs' } });
  assert(
    persistedUiValue(key, {}, isRecordOf(isOneOf(ITEM_PANELS)))['7'] === 'knobs',
    'the item drawer left open last session is the drawer that opens',
  );
  writePersistedUiValue(key, { '7': 'art' });
  assert(
    JSON.stringify(storedUiState()[key]) === '{"7":"art"}',
    'opening an item drawer writes which panel it is into the uiState doc',
  );
}

function checkTheOpenBackdropDrawerSurvivesTheNextLoad(): void {
  const key = PERSISTED_UI_KEYS.openInventoryBackdrops;
  seedUiState({ [key]: ['3'] });
  assert(
    persistedUiValue(key, [], isStringArray).includes('3'),
    'the inventory backdrop drawer left open last session opens again',
  );
}

function checkADrawerNamingAPanelThatIsGoneOpensNothing(): void {
  const key = PERSISTED_UI_KEYS.openCreaturePanels;
  seedUiState({ [key]: { '2': 'a panel this build never had' } });
  assert(
    Object.keys(persistedUiValue(key, {}, isRecordOf(isOneOf(CREATURE_PANELS)))).length === 0,
    'a stored creature drawer naming a panel that no longer exists opens nothing',
  );
}

function assetEditorComponents(): string[] {
  return filesUnder(ASSET_EDITOR_ROOT, endingIn('.tsx'));
}

function seedUiState(state: Record<string, unknown>): void {
  seedPersistedFile('uiState', state);
}

function storedUiState(): Record<string, unknown> {
  return readPersistedFile<Record<string, unknown>>('uiState') ?? {};
}

function assert(condition: boolean, what: string): void {
  if (!condition) {
    console.error(`persisted ui state check failed: ${what}`);
    process.exit(1);
  }
  console.log(`  ok: ${what}`);
}
