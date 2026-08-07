import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { BILLBOARD, renderLabel, type ItemDef } from '../../items/itemDef';
import { Button } from '../controls/Button';
import { IconButton } from '../controls/IconButton';
import { classes } from '../controls/classes';
import { COLOR_INPUT_CLASSES, FIELD_CLASSES } from '../controls/fieldClasses';
import { PixelArtEditor } from '../pixelArtEditor/PixelArtEditor';
import { SpriteArtEditor } from '../pixelArtEditor/SpriteArtEditor';
import { SymbolInput } from '../tileEditor/SymbolInput';
import { ItemRenderKnobs } from './ItemRenderKnobs';
import { ItemSpritePreview } from './ItemSpritePreview';

type OpenPanel = 'none' | 'knobs' | 'art';

export function ItemRow({ item }: { item: ItemDef }) {
  const { perform } = useAppRuntime();
  const [openPanel, setOpenPanel] = useState<OpenPanel>('none');
  const edit = (patch: Record<string, unknown>) => perform('update_item', { item_id: item.id, ...patch });
  const toggle = (panel: Exclude<OpenPanel, 'none'>) =>
    setOpenPanel(openPanel === panel ? 'none' : panel);
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1.5">
        <IconButton title="pixel art" active={openPanel === 'art'} onClick={() => toggle('art')}>
          <ItemSpritePreview item={item} />
        </IconButton>
        <input
          type="color"
          className={COLOR_INPUT_CLASSES}
          title="color — the ascii ink, and the fallback where there is no art"
          value={item.color}
          onChange={(event) => edit({ color: event.target.value })}
        />
        <SymbolInput symbol={item.symbol} onPick={(symbol) => edit({ symbol })} />
        <input
          type="text"
          title="name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={item.name}
          onChange={(event) => edit({ name: event.target.value })}
        />
        <Button
          className="px-2 py-0.5 text-[11px]"
          title={`${renderLabel(item.render)} — ${item.gridWidth}×${item.gridHeight} in an inventory`}
          active={openPanel === 'knobs'}
          onClick={() => toggle('knobs')}
        >
          {renderLabel(item.render)} {item.gridWidth}×{item.gridHeight}
        </Button>
        <Button
          className="px-2 py-0.5"
          title="duplicate item"
          onClick={() => perform('duplicate_item', { item_id: item.id })}
        >
          ⧉
        </Button>
        <Button
          className="px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink"
          title="delete item"
          onClick={() => perform('remove_item', { item_id: item.id })}
        >
          ×
        </Button>
      </div>
      {openPanel === 'knobs' && <ItemRenderKnobs item={item} />}
      {openPanel === 'art' && <ItemArtEditor item={item} />}
    </div>
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
