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
import { ASSET_KINDS, type AssetKind } from '../asset';
import { AssetsTabs } from './AssetsTabs';

export function AssetsPanel() {
  const { prefabs } = useAppRuntime();
  const [tab, setTab] = usePersistedUiValue<AssetKind>(
    PERSISTED_UI_KEYS.assetKind,
    'tiles',
    isOneOf(ASSET_KINDS),
  );
  useEffect(() => prefabs.onPrefabAdded(() => setTab('prefabs')), [prefabs]);
  return (
    <>
      <AssetsTabs tab={tab} onSelect={setTab} />
      {tab === 'tiles' && <TilesTab />}
      {tab === 'items' && <ItemsTab />}
      {tab === 'prefabs' && <PrefabsTab />}
      {tab === 'creatures' && <CreaturesTab />}
      {tab === 'characters' && <CharactersTab />}
    </>
  );
}
