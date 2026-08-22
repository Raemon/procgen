import { isCharacter } from '@/features/asset-library/creatures/creatureDef';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { useRerenderOnCreatureChange } from '@/features/app-shell/runtime/rerenderHooks';
import { forgetOpenPanelOfRow } from '@/features/app-shell/state/forgetOpenPanelOfRow';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
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
      rename: (name: string) => perform('update_creature', { creature_id: creature.id, name }),
      insert: () => perform('insert_creature', { creature_id: creature.id }),
      duplicate: () => perform('duplicate_creature', { creature_id: creature.id }),
      remove: () => {
        forgetOpenPanelOfRow(PERSISTED_UI_KEYS.openCreaturePanels, creature.id);
        perform('remove_creature', { creature_id: creature.id });
      },
    }));
}
