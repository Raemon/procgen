import { RailItem, RailStack } from '../../frontend/collapsedRail/RailItem';
import { FOLDER_TIPS } from '../help/libraryTips';
import { LIBRARY_FOLDERS, type LibraryFolder } from '../librarySelection';

export function LibraryRail() {
  return (
    <RailStack>
      {LIBRARY_FOLDERS.map((folder) => (
        <RailItem key={folder} tip={FOLDER_TIPS[folder]}>
          {railLabel(folder)}
        </RailItem>
      ))}
    </RailStack>
  );
}

function railLabel(folder: LibraryFolder): string {
  return folder.slice(0, 2);
}
