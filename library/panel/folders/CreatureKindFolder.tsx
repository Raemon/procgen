import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnCreatureChange } from '../../../frontend/rerenderHooks';
import { Button } from '../../../frontend/controls/Button';
import { isCharacter } from '../../../assets/creatures/creatureDef';
import { ADD_CHARACTER_TIP, ADD_CREATURE_TIP, FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function CreatureKindFolder({ folder }: { folder: 'creatures' | 'characters' }) {
  const { creatures, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  useRerenderOnCreatureChange();
  const wantsCharacters = folder === 'characters';
  const shown = creatures.all().filter((creature) => isCharacter(creature) === wantsCharacters);

  function addAndSelectIt(): void {
    perform(wantsCharacters ? 'add_character' : 'add_creature');
    const added = creatures.all().at(-1);
    if (added) select(folder, String(added.id));
  }

  return (
    <LibraryFolder folder={folder} tip={FOLDER_TIPS[folder]} count={shown.length}>
      {shown.map((creature) => (
        <LibraryRow
          key={creature.id}
          folder={folder}
          entryKey={String(creature.id)}
          name={creature.name}
          glyph={creature.symbol}
          tint={creature.color}
          tip={{
            title: creature.name,
            body: `${folder.slice(0, -1)} ${creature.id} · symbol “${creature.symbol}”`,
          }}
        />
      ))}
      <Button
        className="mt-1 w-full"
        tip={wantsCharacters ? ADD_CHARACTER_TIP : ADD_CREATURE_TIP}
        onClick={addAndSelectIt}
      >
        + add {wantsCharacters ? 'character' : 'creature'}
      </Button>
    </LibraryFolder>
  );
}
