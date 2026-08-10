import type { CubeFaceArt, FacePixels } from './tileFaceArt';

export function dominantFaceColor(art: CubeFaceArt | null): string | null {
  return art ? dominantPixelColor(art.top) : null;
}

function dominantPixelColor(pixels: FacePixels): string | null {
  const counts = new Map<string, number>();
  for (const pixel of pixels) {
    if (pixel) counts.set(pixel, (counts.get(pixel) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [color, count] of counts) {
    if (count > bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}
