import { useState } from 'react';
import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { BILLBOARD, type ItemDef } from '../itemDef';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { IconButton } from '@/features/app-shell/controls/IconButton';
import { classes } from '@/features/app-shell/controls/classes';
import { ColorField } from '@/features/app-shell/controls/ColorField';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedOpenPanel } from '@/features/app-shell/state/usePersistedOpenPanel';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { deleteRowConfirmation } from '@/features/asset-library/help/rowActionTips';
import { useLibrarySelection } from '@/features/asset-library/panel/useLibrarySelection';
import { PixelArtEditor } from '../../pixelArtEditor/PixelArtEditor';
import { SpriteArtEditor } from '../../pixelArtEditor/SpriteArtEditor';
import { SymbolInput } from '../../tiles/editor/SymbolInput';
import {
  deleteItemTip,
  duplicateItemTip,
  ITEM_ART_TIP,
  ITEM_COLOR_TIP,
  ITEM_NAME_TIP,
} from './help/itemTips';
import { ITEM_PANELS, type ItemPanel } from './itemPanels';
import { ItemRenderKnobs } from './ItemRenderKnobs';
import { ItemSpritePreview } from './ItemSpritePreview';

export function ItemSheet({ item }: { item: ItemDef }) {
  const { perform } = useAppRuntime();
  const { openPanel, toggle, forgetRow } = usePersistedOpenPanel<Exclude<ItemPanel, 'none'>>(
    PERSISTED_UI_KEYS.openItemPanels,
    ITEM_PANELS,
    item.id,
  );
  const edit = (patch: CommandParams) => perform('update_item', { item_id: item.id, ...patch });
  return (
    <div className="mb-1.5">
      <div className="mb-2 flex items-center gap-1.5">
        <IconButton tip={ITEM_ART_TIP} active={openPanel === 'art'} onClick={() => toggle('art')}>
          <ItemSpritePreview item={item} />
        </IconButton>
        <ColorField ink={item.color} tip={ITEM_COLOR_TIP} onChange={(color) => edit({ color })} />
        <SymbolInput symbol={item.symbol} tint={item.color} onPick={(symbol) => edit({ symbol })} />
        <input
          type="text"
          aria-label="item name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={item.name}
          onChange={(event) => edit({ name: event.target.value })}
          {...tooltipHandlers(ITEM_NAME_TIP)}
        />
      </div>
      <ItemActionsRow item={item} onForgetPanel={forgetRow} />
      <ItemRenderKnobs item={item} />
      {openPanel === 'art' && <ItemArtEditor item={item} />}
    </div>
  );
}

function ItemActionsRow({ item, onForgetPanel }: { item: ItemDef; onForgetPanel(): void }) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisItem(): void {
    setConfirmingDelete(false);
    onForgetPanel();
    perform('remove_item', { item_id: item.id });
    clear();
  }

  return (
    <>
      <div className="mb-2 flex gap-1.5">
        <Button
          className="flex-1"
          tip={duplicateItemTip(item)}
          onClick={() => perform('duplicate_item', { item_id: item.id })}
        >
          ⧉ duplicate
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={deleteItemTip(item)}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(item.name)}
          onConfirm={deleteThisItem}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}

function ItemArtEditor({ item }: { item: ItemDef }) {
  const { perform } = useAppRuntime();
  if (item.render === BILLBOARD) {
    return (
      <SpriteArtEditor
        sprite={item.sprite}
        onChange={(sprite) => perform('update_item', { item_id: item.id, sprite })}
      />
    );
  }
  return (
    <PixelArtEditor
      art={item.faceArt}
      baseColor={item.color}
      onChange={(faceArt) => perform('update_item', { item_id: item.id, face_art: faceArt })}
    />
  );
}
