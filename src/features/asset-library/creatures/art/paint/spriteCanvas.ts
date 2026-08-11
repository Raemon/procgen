import type { SpriteArt } from '../../../tiles/spriteArt';
import { hexOfPacked, packHex, packRgb } from '../../../tiles/art/packedHex';

const OPAQUE_ENOUGH_TO_KEEP = 0.45;

export interface SpriteCanvas {
  size: number;
  red: Float32Array;
  green: Float32Array;
  blue: Float32Array;
  coverage: Float32Array;
}

export function blankSpriteCanvas(size: number): SpriteCanvas {
  return {
    size,
    red: new Float32Array(size * size),
    green: new Float32Array(size * size),
    blue: new Float32Array(size * size),
    coverage: new Float32Array(size * size),
  };
}

export function blendPixel(
  canvas: SpriteCanvas,
  x: number,
  y: number,
  packedColor: number,
  alpha: number,
): void {
  if (alpha <= 0) return;
  const column = Math.round(x);
  const row = Math.round(y);
  if (column < 0 || row < 0 || column >= canvas.size || row >= canvas.size) return;
  const index = row * canvas.size + column;
  const covering = alpha > 1 ? 1 : alpha;
  const keep = 1 - covering;
  canvas.red[index] = ((packedColor >> 16) & 255) * covering + canvas.red[index]! * keep;
  canvas.green[index] = ((packedColor >> 8) & 255) * covering + canvas.green[index]! * keep;
  canvas.blue[index] = (packedColor & 255) * covering + canvas.blue[index]! * keep;
  canvas.coverage[index] = covering + canvas.coverage[index]! * keep;
}

export function paintPixel(canvas: SpriteCanvas, x: number, y: number, color: string): void {
  blendPixel(canvas, x, y, packHex(color), 1);
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

export function spriteArtOf(canvas: SpriteCanvas): SpriteArt {
  const pixels = new Array<string | null>(canvas.size * canvas.size).fill(null);
  for (let index = 0; index < pixels.length; index++) {
    const coverage = canvas.coverage[index]!;
    if (coverage < OPAQUE_ENOUGH_TO_KEEP) continue;
    pixels[index] = hexOfPacked(
      packRgb(
        canvas.red[index]! / coverage,
        canvas.green[index]! / coverage,
        canvas.blue[index]! / coverage,
      ),
    );
  }
  return pixels;
}
