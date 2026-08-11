import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { useItemEntries } from '../entries/useItemEntries';
import { ADD_ITEM_TIP, FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

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
      {entries.map((entry) => (
        <LibraryRow key={entry.key} folder="items" entry={entry} />
      ))}
      <Button className="mt-1 w-full" tip={ADD_ITEM_TIP} onClick={addItemAndSelectIt}>
        + add item
      </Button>
    </LibraryFolder>
  );
}
