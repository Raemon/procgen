import { useEffect, useRef } from 'react';
import type { ItemDef } from '../../items/itemDef';
import { paintSpritePixels } from '../../views/paintSpritePixels';
import { spriteGridSize, type SpriteArt } from '../../world/tiles/spriteArt';

export function itemPreviewSprite(item: ItemDef): SpriteArt | null {
  return item.sprite ?? item.faceArt?.north ?? null;
}

export function ItemSpritePreview({ item, className }: { item: ItemDef; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sprite = itemPreviewSprite(item);
  useEffect(() => {
    if (canvas.current) drawSprite(canvas.current, sprite, item.color);
  }, [sprite, item.color]);
  return (
    <canvas
      ref={canvas}
      className={className ?? 'block h-full w-full rounded-[2px] [image-rendering:pixelated]'}
    />
  );
}

function drawSprite(canvas: HTMLCanvasElement, sprite: SpriteArt | null, fallback: string): void {
  const ctx = canvas.getContext('2d')!;
  if (!sprite) {
    canvas.width = canvas.height = 1;
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, 1, 1);
    return;
  }
  canvas.width = canvas.height = spriteGridSize(sprite);
  paintSpritePixels(ctx, sprite, 1);
}
