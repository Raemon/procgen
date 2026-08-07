import { useAppRuntime } from '../../app/appRuntimeContext';
import {
  useRerenderOnCreatureChange,
  useRerenderOnItemChange,
  useRerenderOnPrefabChange,
  useRerenderOnTilesetChange,
} from '../../app/rerenderHooks';
import { isCharacter } from '../../creatures/creatureDef';
import { RailItem, RailStack } from '../collapsedRail/RailItem';
import { railInitials } from '../collapsedRail/railInitials';
import { isOneOf } from '../uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../uiState/persistedUiKeys';
import { usePersistedUiValue } from '../uiState/usePersistedUiValue';
import { LIBRARY_TABS, type LibraryTab } from './LibraryTabs';

export function LibraryRail() {
  const [tab] = usePersistedUiValue<LibraryTab>(
    PERSISTED_UI_KEYS.libraryTab,
    'tiles',
    isOneOf(LIBRARY_TABS),
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
  const { tileset } = useAppRuntime();
  useRerenderOnTilesetChange();
  return (
    <>
      {tileset.all().map((tile) => (
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
