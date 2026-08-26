import { FOLDER_TIPS } from '../../help/libraryTips';
import { useSavedWorldEntries } from '../entries/useSavedWorldEntries';
import { LibraryFolder } from '../LibraryFolder';
import { AssetFolderSection } from './AssetFolderSection';

export function SavedWorldsFolder() {
  const entries = useSavedWorldEntries();
  return (
    <LibraryFolder
      folder="savedWorlds"
      label="saved worlds"
      tip={FOLDER_TIPS.savedWorlds}
      count={entries.length}
    >
      <AssetFolderSection section="savedWorlds" entries={entries} />
    </LibraryFolder>
  );
}
