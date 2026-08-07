import { useEffect } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { CharactersTab } from '../characters/editor/CharactersTab';
import { CreaturesTab } from '../creatures/editor/CreaturesTab';
import { ItemsTab } from '../items/editor/ItemsTab';
import { PrefabsTab } from '../prefabs/editor/PrefabsTab';
import { TilesTab } from '../tiles/editor/TilesTab';
import { isOneOf } from '../../frontend/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../../frontend/uiState/persistedUiKeys';
import { usePersistedUiValue } from '../../frontend/uiState/usePersistedUiValue';
import { LIBRARY_TABS, LibraryTabs, type LibraryTab } from './LibraryTabs';

export function LibraryPanel() {
  const { prefabs } = useAppRuntime();
  const [tab, setTab] = usePersistedUiValue<LibraryTab>(
    PERSISTED_UI_KEYS.libraryTab,
    'tiles',
    isOneOf(LIBRARY_TABS),
  );
  useEffect(() => prefabs.onPrefabAdded(() => setTab('prefabs')), [prefabs]);
  return (
    <>
      <LibraryTabs tab={tab} onSelect={setTab} />
      {tab === 'tiles' && <TilesTab />}
      {tab === 'items' && <ItemsTab />}
      {tab === 'prefabs' && <PrefabsTab />}
      {tab === 'creatures' && <CreaturesTab />}
      {tab === 'characters' && <CharactersTab />}
    </>
  );
}
