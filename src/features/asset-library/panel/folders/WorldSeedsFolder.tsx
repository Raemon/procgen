import { useWorldSeedEntries } from '../entries/useWorldSeedEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { AssetFolderSection } from './AssetFolderSection';

export function WorldSeedsFolder() {
  const entries = useWorldSeedEntries();
  return (
    <LibraryFolder folder="worlds" label="worlds" tip={FOLDER_TIPS.worlds} count={entries.length}>
      <AssetFolderSection section="worlds" entries={entries} />
    </LibraryFolder>
  );
}
