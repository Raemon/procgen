import { spriteGridSize, type SpriteArt } from '../world/tiles/spriteArt';

export function paintSpritePixels(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteArt,
  pixelSize: number,
): void {
  const size = spriteGridSize(sprite);
  ctx.clearRect(0, 0, size * pixelSize, size * pixelSize);
  sprite.forEach((pixel, index) => {
    if (pixel === null) return;
    ctx.fillStyle = pixel;
    ctx.fillRect((index % size) * pixelSize, Math.floor(index / size) * pixelSize, pixelSize, pixelSize);
  });
}
