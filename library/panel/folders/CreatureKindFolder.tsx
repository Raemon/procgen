import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { Button } from '../../../frontend/controls/Button';
import { ADD_CREATURE_TIP } from '../../../assets/creatures/editor/help/creatureTips';
import { useCreatureEntries } from '../entries/useCreatureEntries';
import { ADD_CHARACTER_TIP, FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function CreatureKindFolder({ folder }: { folder: 'creatures' | 'characters' }) {
  const { creatures, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  const entries = useCreatureEntries(folder);
  const wantsCharacters = folder === 'characters';

  function addAndSelectIt(): void {
    perform(wantsCharacters ? 'add_character' : 'add_creature');
    const added = creatures.all().at(-1);
    if (added) select(folder, String(added.id));
  }

  return (
    <LibraryFolder folder={folder} tip={FOLDER_TIPS[folder]} count={entries.length}>
      {entries.map((entry) => (
        <LibraryRow key={entry.key} folder={folder} entry={entry} />
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
