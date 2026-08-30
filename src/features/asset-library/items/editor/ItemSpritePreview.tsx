import type { ItemDef } from '../itemDef';
import { PixelGridCanvas } from '../../pixelArtEditor/PixelGridCanvas';
import { unpaintedInk } from '../../tiles/inkColor';
import type { SpriteArt } from '../../tiles/spriteArt';

const SOLID_SWATCH: SpriteArt = [null];

export function itemPreviewSprite(item: ItemDef): SpriteArt | null {
  return item.sprite ?? item.faceArt?.north ?? null;
}

export function ItemSpritePreview({ item, className }: { item: ItemDef; className?: string }) {
  const sprite = itemPreviewSprite(item);
  return (
    <PixelGridCanvas
      pixels={sprite ?? SOLID_SWATCH}
      unpainted={sprite ? null : unpaintedInk(item.color)}
      className={className ?? 'block h-full w-full rounded-[2px] [image-rendering:pixelated]'}
    />
  );
}
