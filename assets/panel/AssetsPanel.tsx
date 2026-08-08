import { useEffect } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { CharactersTab } from '../characters/editor/CharactersTab';
import { CreaturesTab } from '../creatures/editor/CreaturesTab';
import { ItemsTab } from '../items/editor/ItemsTab';
import { PiecesTab } from '../pieces/editor/PiecesTab';
import { TilesTab } from '../tiles/editor/TilesTab';
import { isOneOf } from '../../frontend/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../../frontend/uiState/persistedUiKeys';
import { usePersistedUiValue } from '../../frontend/uiState/usePersistedUiValue';
import { ASSET_KINDS, type AssetKind } from '../asset';
import { AssetsTabs } from './AssetsTabs';

export function AssetsPanel() {
  const { pieces } = useAppRuntime();
  const [tab, setTab] = usePersistedUiValue<AssetKind>(
    PERSISTED_UI_KEYS.assetKind,
    'tiles',
    isOneOf(ASSET_KINDS),
  );
  useEffect(() => pieces.onPieceAdded(() => setTab('pieces')), [pieces]);
  return (
    <>
      <AssetsTabs tab={tab} onSelect={setTab} />
      {tab === 'tiles' && <TilesTab />}
      {tab === 'items' && <ItemsTab />}
      {tab === 'pieces' && <PiecesTab />}
      {tab === 'creatures' && <CreaturesTab />}
      {tab === 'characters' && <CharactersTab />}
    </>
  );
}
