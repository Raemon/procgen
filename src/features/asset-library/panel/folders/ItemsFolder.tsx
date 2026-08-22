import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { useItemEntries } from '../entries/useItemEntries';
import { ADD_ITEM_TIP, FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { useLibrarySelection } from '../useLibrarySelection';
import { AssetFolderSection } from './AssetFolderSection';

export function ItemsFolder() {
  const { items, perform } = useAppRuntime();
  const { select } = useLibrarySelection();
  const entries = useItemEntries();

  function addItemAndSelectIt(): void {
    perform('add_item');
    const added = items.all().at(-1);
    if (added) select('items', String(added.id));
  }

  return (
    <LibraryFolder folder="items" tip={FOLDER_TIPS.items} count={entries.length}>
      <AssetFolderSection section="items" entries={entries}>
        <Button className="mt-1 w-full" tip={ADD_ITEM_TIP} onClick={addItemAndSelectIt}>
          + add item
        </Button>
      </AssetFolderSection>
    </LibraryFolder>
  );
}
