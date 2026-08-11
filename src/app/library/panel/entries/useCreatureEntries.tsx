import { isCharacter } from '../../../assets/creatures/creatureDef';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnCreatureChange } from '../../../frontend/rerenderHooks';
import { forgetOpenPanelOfRow } from '../../../frontend/uiState/forgetOpenPanelOfRow';
import { PERSISTED_UI_KEYS } from '../../../frontend/uiState/persistedUiKeys';
import { SpriteIcon } from '../icons/SpriteIcon';
import type { LibraryEntry } from './libraryEntry';

export function useCreatureEntries(folder: 'creatures' | 'characters'): LibraryEntry[] {
  const { creatures, perform } = useAppRuntime();
  useRerenderOnCreatureChange();
  const wantsCharacters = folder === 'characters';
  return creatures
    .all()
    .filter((creature) => isCharacter(creature) === wantsCharacters)
    .map((creature) => ({
      key: String(creature.id),
      name: creature.name,
      icon: (
        <SpriteIcon
          sprite={creature.faceArt?.north ?? null}
          glyph={creature.symbol}
          tint={creature.color}
        />
      ),
      tip: {
        title: creature.name,
        body: `${folder.slice(0, -1)} ${creature.id} · symbol “${creature.symbol}”`,
      },
      duplicate: () => perform('duplicate_creature', { creature_id: creature.id }),
      remove: () => {
        forgetOpenPanelOfRow(PERSISTED_UI_KEYS.openCreaturePanels, creature.id);
        perform('remove_creature', { creature_id: creature.id });
      },
    }));
}
