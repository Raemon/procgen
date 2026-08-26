import { useWorldSeedEntries } from '../entries/useWorldSeedEntries';
import { FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { AssetFolderSection } from './AssetFolderSection';

export function WorldSeedsFolder() {
  const entries = useWorldSeedEntries();
  return (
    <LibraryFolder folder="worldSeeds" label="world seeds" tip={FOLDER_TIPS.worldSeeds} count={entries.length}>
      <AssetFolderSection section="worldSeeds" entries={entries} />
    </LibraryFolder>
  );
}
