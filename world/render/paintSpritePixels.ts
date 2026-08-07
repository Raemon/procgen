import { spriteGridSize, type SpriteArt } from '../../library/tiles/spriteArt';
import { paintPixelsAsImage } from './paintPixelsAsImage';

export function paintSpritePixels(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteArt,
  pixelSize: number,
): void {
  const size = spriteGridSize(sprite);
  ctx.clearRect(0, 0, size * pixelSize, size * pixelSize);
  if (pixelSize === 1) {
    paintPixelsAsImage(ctx, sprite, size, null);
    return;
  }
  sprite.forEach((pixel, index) => {
    if (pixel === null) return;
    ctx.fillStyle = pixel;
    ctx.fillRect((index % size) * pixelSize, Math.floor(index / size) * pixelSize, pixelSize, pixelSize);
  });
}
