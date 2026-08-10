import { RailStack } from '../../frontend/collapsedRail/RailItem';
import { useLibraryEntries } from './entries/useLibraryEntries';
import { LIBRARY_FOLDERS } from '../librarySelection';
import { LibraryRailIcon } from './LibraryRailIcon';

export function LibraryRail() {
  const entries = useLibraryEntries();
  return (
    <RailStack>
      {LIBRARY_FOLDERS.flatMap((folder) =>
        entries[folder].map((entry) => (
          <LibraryRailIcon key={`${folder}:${entry.key}`} folder={folder} entry={entry} />
        )),
      )}
    </RailStack>
  );
}
