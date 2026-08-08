import { useAppRuntime } from '../../frontend/appRuntimeContext';
import {
  useRerenderOnCreatureChange,
  useRerenderOnItemChange,
  useRerenderOnPrefabChange,
  useRerenderOnTileAssetChange,
} from '../../frontend/rerenderHooks';
import { isCharacter } from '../creatures/creatureDef';
import { RailItem, RailStack } from '../../frontend/collapsedRail/RailItem';
import { railInitials } from '../../frontend/collapsedRail/railInitials';
import { isOneOf } from '../../frontend/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../../frontend/uiState/persistedUiKeys';
import { usePersistedUiValue } from '../../frontend/uiState/usePersistedUiValue';
import { ASSET_KINDS, type AssetKind } from '../asset';

export function AssetsRail() {
  const [tab] = usePersistedUiValue<AssetKind>(
    PERSISTED_UI_KEYS.assetKind,
    'tiles',
    isOneOf(ASSET_KINDS),
  );
  return (
    <RailStack>
      {tab === 'tiles' && <TileRailItems />}
      {tab === 'items' && <ItemRailItems />}
      {tab === 'prefabs' && <PrefabRailItems />}
      {(tab === 'creatures' || tab === 'characters') && <CreatureRailItems characters={tab === 'characters'} />}
    </RailStack>
  );
}

function TileRailItems() {
  const { tileAssets } = useAppRuntime();
  useRerenderOnTileAssetChange();
  return (
    <>
      {tileAssets.all().map((tile) => (
        <RailItem
          key={tile.id}
          tint={tile.color}
          tip={{
            title: tile.name,
            body: `tile ${tile.id} · symbol “${tile.symbol}” · ${tile.walkable ? 'walkable' : 'blocking'}`,
          }}
        >
          {tile.symbol}
        </RailItem>
      ))}
    </>
  );
}

function ItemRailItems() {
  const { items } = useAppRuntime();
  useRerenderOnItemChange();
  return (
    <>
      {items.all().map((item) => (
        <RailItem key={item.id} tip={{ title: item.name, body: `item ${item.id}` }}>
          {railInitials(item.name)}
        </RailItem>
      ))}
    </>
  );
}

function PrefabRailItems() {
  const { prefabs } = useAppRuntime();
  useRerenderOnPrefabChange();
  return (
    <>
      {prefabs.all().map((prefab) => (
        <RailItem
          key={prefab.id}
          tip={{
            title: prefab.name,
            body: `prefab ${prefab.id} · ${prefab.width}×${prefab.depth}, ${prefab.layers} layers`,
          }}
        >
          {railInitials(prefab.name)}
        </RailItem>
      ))}
    </>
  );
}

function CreatureRailItems({ characters }: { characters: boolean }) {
  const { creatures } = useAppRuntime();
  useRerenderOnCreatureChange();
  return (
    <>
      {creatures
        .all()
        .filter((creature) => isCharacter(creature) === characters)
        .map((creature) => (
          <RailItem
            key={creature.id}
            tint={creature.color}
            tip={{
              title: creature.name,
              body: `${characters ? 'character' : 'creature'} ${creature.id} · symbol “${creature.symbol}”`,
            }}
          >
            {creature.symbol}
          </RailItem>
        ))}
    </>
  );
}
