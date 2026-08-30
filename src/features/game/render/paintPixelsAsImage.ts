import { packHex } from '@/features/asset-library/tiles/art/packedHex';
import { isTransparentInk, opaqueInk } from '@/features/asset-library/tiles/inkColor';

export function paintPixelsAsImage(
  ctx: CanvasRenderingContext2D,
  pixels: readonly (string | null)[],
  size: number,
  transparentAs: string | null,
): void {
  const image = ctx.createImageData(size, size);
  const fallback = packedInkOf(transparentAs);
  for (let index = 0; index < pixels.length; index++) {
    const pixel = pixels[index];
    const packed = pixel === null || pixel === undefined ? fallback : packedInkOf(pixel);
    if (packed === null) continue;
    writeOpaqueChannel(image.data, index * 4, packed);
  }
  ctx.putImageData(image, 0, 0);
}

function packedInkOf(ink: string | null): number | null {
  if (ink === null || isTransparentInk(ink)) return null;
  return packHex(opaqueInk(ink));
}

function writeOpaqueChannel(data: Uint8ClampedArray, offset: number, packed: number): void {
  data[offset] = (packed >> 16) & 255;
  data[offset + 1] = (packed >> 8) & 255;
  data[offset + 2] = packed & 255;
  data[offset + 3] = 255;
}
