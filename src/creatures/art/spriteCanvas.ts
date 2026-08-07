import type { SpriteArt } from '../../world/tiles/spriteArt';

export interface SpriteCanvas {
  size: number;
  pixels: SpriteArt;
}

export function blankSpriteCanvas(size: number): SpriteCanvas {
  return { size, pixels: new Array<string | null>(size * size).fill(null) };
}

export function paintPixel(canvas: SpriteCanvas, x: number, y: number, color: string): void {
  if (x < 0 || y < 0 || x >= canvas.size || y >= canvas.size) return;
  canvas.pixels[y * canvas.size + x] = color;
}

export function paintRect(
  canvas: SpriteCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): void {
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) paintPixel(canvas, x + column, y + row, color);
  }
}
