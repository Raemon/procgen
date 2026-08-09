import { RailItem, RailStack } from '../../frontend/collapsedRail/RailItem';
import { railInitials } from '../../frontend/collapsedRail/railInitials';
import { CURRENT_WORLD, type LibrarySelection } from '../librarySelection';
import { storedWorldOf } from '../worldKeys';
import { useLibrarySelection } from './useLibrarySelection';

export function DetailRail() {
  const [selection] = useLibrarySelection();
  return (
    <RailStack>
      <RailItem
        tip={{
          title: selection.folder,
          body: `${nameOf(selection)} is open in the detail column.`,
        }}
      >
        {railInitials(selection.folder)}
      </RailItem>
    </RailStack>
  );
}

function nameOf(selection: LibrarySelection): string {
  if (selection.folder !== 'worlds') return `“${selection.key}”`;
  const stored = storedWorldOf(selection.key);
  if (stored) return `“${stored.name}”`;
  return selection.key === CURRENT_WORLD ? 'the world you are editing' : `“${selection.key}”`;
}
