import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { Button } from '../../../frontend/controls/Button';
import { ADD_CULTURE_TIP } from '../../../assets/cultures/editor/help/cultureTips';
import { useCultureEntries } from '../entries/useCultureEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function CulturesFolder() {
  const { cultures, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  const entries = useCultureEntries();

  function addCultureAndSelectIt(): void {
    perform('add_culture');
    const added = cultures.all().at(-1);
    if (added) select('cultures', String(added.id));
  }

  return (
    <LibraryFolder folder="cultures" tip={FOLDER_TIPS.cultures} count={entries.length}>
      {entries.map((entry) => (
        <LibraryRow key={entry.key} folder="cultures" entry={entry} />
      ))}
      <Button className="mt-1 w-full" tip={ADD_CULTURE_TIP} onClick={addCultureAndSelectIt}>
        + add culture
      </Button>
    </LibraryFolder>
  );
}
