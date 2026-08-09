import { RailItem, RailStack } from '../../frontend/collapsedRail/RailItem';
import { FOLDER_TIPS, WORLD_ROW_TIP } from '../help/libraryTips';
import { LIBRARY_FOLDERS, type LibraryFolder } from '../librarySelection';

export function LibraryRail() {
  return (
    <RailStack>
      {LIBRARY_FOLDERS.map((folder) => (
        <RailItem key={folder} tip={folder === 'world' ? WORLD_ROW_TIP : FOLDER_TIPS[folder]}>
          {railLabel(folder)}
        </RailItem>
      ))}
    </RailStack>
  );
}

function railLabel(folder: LibraryFolder): string {
  return folder.slice(0, 2);
}
