import { useNodeGroupEntries } from '../entries/useNodeGroupEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { AssetFolderSection } from './AssetFolderSection';

export function NodeGroupsFolder() {
  const entries = useNodeGroupEntries();
  return (
    <LibraryFolder folder="groups" label="node groups" tip={FOLDER_TIPS.groups} count={entries.length}>
      <AssetFolderSection section="groups" entries={entries} />
    </LibraryFolder>
  );
}
