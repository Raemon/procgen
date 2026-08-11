import { useWorldEntries } from '../entries/useWorldEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';

export function WorldsFolder() {
  const entries = useWorldEntries();
  return (
    <LibraryFolder folder="worlds" label="worlds" tip={FOLDER_TIPS.worlds} count={entries.length}>
      {entries.map((entry) => (
        <LibraryRow key={entry.key} folder="worlds" entry={entry} />
      ))}
    </LibraryFolder>
  );
}
