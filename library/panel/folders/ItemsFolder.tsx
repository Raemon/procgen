import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnItemChange } from '../../../frontend/rerenderHooks';
import { Button } from '../../../frontend/controls/Button';
import { renderLabel } from '../../../assets/items/itemDef';
import { ADD_ITEM_TIP, FOLDER_TIPS } from '../../help/libraryTips';
import { LibraryFolder } from '../LibraryFolder';
import { LibraryRow } from '../LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function ItemsFolder() {
  const { items, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  useRerenderOnItemChange();
  const all = items.all();

  function addItemAndSelectIt(): void {
    perform('add_item');
    const added = items.all().at(-1);
    if (added) select('items', String(added.id));
  }

  return (
    <LibraryFolder folder="items" tip={FOLDER_TIPS.items} count={all.length}>
      {all.map((item) => (
        <LibraryRow
          key={item.id}
          folder="items"
          entryKey={String(item.id)}
          name={item.name}
          glyph={item.symbol}
          tint={item.color}
          tip={{
            title: item.name,
            body: `item ${item.id} · ${renderLabel(item.render)} · ${item.gridWidth}×${item.gridHeight} cells`,
          }}
        />
      ))}
      <Button className="mt-1 w-full" tip={ADD_ITEM_TIP} onClick={addItemAndSelectIt}>
        + add item
      </Button>
    </LibraryFolder>
  );
}
