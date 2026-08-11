import { RailItem, RailStack } from '../../frontend/collapsedRail/RailItem';
import { railInitials } from '../../frontend/collapsedRail/railInitials';
import { useLibrarySelection } from './useLibrarySelection';

export function DetailRail() {
  const { selection } = useLibrarySelection();
  if (!selection) return null;
  return (
    <RailStack>
      <RailItem
        tip={{
          title: selection.folder,
          body: `“${selection.key}” is open in the detail column.`,
        }}
      >
        {railInitials(selection.folder)}
      </RailItem>
    </RailStack>
  );
}
