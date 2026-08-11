import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnItemChange } from '../../../frontend/rerenderHooks';
import { forgetOpenPanelOfRow } from '../../../frontend/uiState/forgetOpenPanelOfRow';
import { PERSISTED_UI_KEYS } from '../../../frontend/uiState/persistedUiKeys';
import { renderLabel } from '../../../assets/items/itemDef';
import { itemPreviewSprite } from '../../../assets/items/editor/ItemSpritePreview';
import { SpriteIcon } from '../icons/SpriteIcon';
import type { LibraryEntry } from './libraryEntry';

export function useItemEntries(): LibraryEntry[] {
  const { items, perform } = useAppRuntime();
  useRerenderOnItemChange();
  return items.all().map((item) => ({
    key: String(item.id),
    name: item.name,
    icon: <SpriteIcon sprite={itemPreviewSprite(item)} glyph={item.symbol} tint={item.color} />,
    tip: {
      title: item.name,
      body: `item ${item.id} · ${renderLabel(item.render)} · ${item.gridWidth}×${item.gridHeight} cells`,
    },
    duplicate: () => perform('duplicate_item', { item_id: item.id }),
    remove: () => {
      forgetOpenPanelOfRow(PERSISTED_UI_KEYS.openItemPanels, item.id);
      forgetOpenPanelOfRow(PERSISTED_UI_KEYS.openInventoryBackdrops, item.id);
      perform('remove_item', { item_id: item.id });
    },
  }));
}
