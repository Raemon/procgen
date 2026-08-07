import { useEffect } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { CharactersTab } from '../characterEditor/CharactersTab';
import { CreaturesTab } from '../creatureEditor/CreaturesTab';
import { ItemsTab } from '../itemEditor/ItemsTab';
import { PrefabsTab } from '../prefabEditor/PrefabsTab';
import { TilesTab } from '../tileEditor/TilesTab';
import { isOneOf } from '../uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../uiState/persistedUiKeys';
import { usePersistedUiValue } from '../uiState/usePersistedUiValue';
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
