import { useNodeGroupEntries } from '../entries/useNodeGroupEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';

export function NodeGroupsFolder() {
  const entries = useNodeGroupEntries();
  return (
    <LibraryFolder folder="groups" label="node groups" tip={FOLDER_TIPS.groups} count={entries.length}>
      {entries.map((entry) => (
        <LibraryRow key={entry.key} folder="groups" entry={entry} />
      ))}
    </LibraryFolder>
  );
}
