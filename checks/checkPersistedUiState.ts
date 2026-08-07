import { installFakeLocalStorage } from './fakeLocalStorage';

const storage = installFakeLocalStorage();

const { isBoolean, isNumber, isNumberOrNull, isOneOf, isRecordOf, isStringArray } = await import(
  '../frontend/uiState/persistedUiGuards'
);
const { persistedUiValue, subscribeToPersistedUiValue, writePersistedUiValue } = await import(
  '../frontend/uiState/persistedUiStore'
);
const { toggledMembers } = await import('../frontend/uiState/toggledMembers');

const LIBRARY_TABS = ['tiles', 'prefabs', 'creatures'] as const;

checkAToggleReachesStorage();
checkTheNextLoadReadsWhatStorageHolds();
checkStorageHoldingTheWrongShapeFallsBackToTheDefault();
checkEveryReaderOfAKeySeesAWrite();
checkTogglingAMemberAddsThenRemovesIt();
checkCollapsingEveryCardReplacesWhateverWasCollapsed();
checkGuardsAcceptOnlyTheShapesTheUiPersists();
console.log('persisted ui state: all checks passed');

function checkAToggleReachesStorage(): void {
  writePersistedUiValue('panel.collapsed', toggledMembers([], 'library'));
  assert(
    storage.getItem('procgen.ui.panel.collapsed.v1') === '["library"]',
    'collapsing a panel writes it to localStorage under a namespaced key',
  );
}

function checkTheNextLoadReadsWhatStorageHolds(): void {
  storage.setItem('procgen.ui.library.tab.v1', JSON.stringify('creatures'));
  storage.setItem('procgen.ui.panel.widths.v1', JSON.stringify({ library: 310 }));
  assert(
    persistedUiValue('library.tab', 'tiles', isOneOf(LIBRARY_TABS)) === 'creatures',
    'the tab selected last session is the tab that opens',
  );
  assert(
    persistedUiValue('panel.widths', {}, isRecordOf(isNumber)).library === 310,
    'a resized panel comes back at the width it was left at',
  );
}

function checkStorageHoldingTheWrongShapeFallsBackToTheDefault(): void {
  storage.setItem('stale.tab', JSON.stringify('a tab that no longer exists'));
  assert(
    persistedUiValue('stale.tab', 'tiles', isOneOf(LIBRARY_TABS)) === 'tiles',
    'a stored value that fails its guard is replaced by the default',
  );
  storage.setItem('procgen.ui.corrupt.widths.v1', '{not json');
  assert(
    persistedUiValue('corrupt.widths', { library: 240 }, isRecordOf(isNumber)).library === 240,
    'unparseable storage does not break the layout',
  );
}

function checkEveryReaderOfAKeySeesAWrite(): void {
  let notifications = 0;
  const unsubscribe = subscribeToPersistedUiValue('procgen.collapsedNodeCards', () => {
    notifications += 1;
  });
  writePersistedUiValue('procgen.collapsedNodeCards', ['node-1']);
  unsubscribe();
  writePersistedUiValue('procgen.collapsedNodeCards', ['node-1', 'node-2']);
  assert(notifications === 1, 'a subscriber hears about writes until it unsubscribes');
  assert(
    persistedUiValue('procgen.collapsedNodeCards', [], isStringArray).join() === 'node-1,node-2',
    'the latest write is what every reader of the key sees',
  );
}

function checkTogglingAMemberAddsThenRemovesIt(): void {
  const collapsed = toggledMembers([], 'node-7');
  assert(collapsed.join() === 'node-7', 'toggling an absent member collapses it');
  assert(toggledMembers(collapsed, 'node-7').length === 0, 'toggling it again expands it');
  assert(toggledMembers(['a', 'b'], 'a').join() === 'b', 'toggling one member leaves the rest alone');
}

function checkCollapsingEveryCardReplacesWhateverWasCollapsed(): void {
  writePersistedUiValue('procgen.collapsedNodeCards', ['node-1']);
  writePersistedUiValue('procgen.collapsedNodeCards', ['node-1', 'node-2', 'node-3']);
  assert(
    persistedUiValue('procgen.collapsedNodeCards', [], isStringArray).length === 3,
    'collapse all stores every card at once rather than toggling them one by one',
  );
  writePersistedUiValue('procgen.collapsedNodeCards', []);
  assert(
    persistedUiValue('procgen.collapsedNodeCards', ['stale'], isStringArray).length === 0,
    'expand all leaves nothing collapsed behind',
  );
}

function checkGuardsAcceptOnlyTheShapesTheUiPersists(): void {
  assert(isStringArray(['a']) && !isStringArray([1]), 'set members must all be strings');
  assert(
    isNumberOrNull(null) && isNumberOrNull(3) && !isNumberOrNull('3'),
    'an open prefab id is a number or nothing',
  );
  assert(!isRecordOf(isNumber)(['library']), 'an array is not a record of panel widths');
  assert(!isNumber(Number.NaN), 'a NaN width is rejected before it reaches the grid');
  assert(
    isBoolean(false) && !isBoolean('false'),
    'the hints toggle only restores a real boolean',
  );
}

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok   ${message}`);
    return;
  }
  console.error(`FAIL ${message}`);
  process.exit(1);
}
