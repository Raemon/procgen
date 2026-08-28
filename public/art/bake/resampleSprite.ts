import { spriteGridSize, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';

const OPAQUE_ENOUGH_TO_KEEP = 0.45;

interface Rgb {
  red: number;
  green: number;
  blue: number;
}

export function resampledSprite(sprite: SpriteArt, size: number): SpriteArt {
  const from = spriteGridSize(sprite);
  if (from === size) return sprite;
  const scale = from / size;
  const resampled: SpriteArt = new Array<string | null>(size * size).fill(null);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      resampled[row * size + column] = areaAverage(sprite, from, {
        left: column * scale,
        top: row * scale,
        span: scale,
      });
    }
  }
  return resampled;
}

interface SourceBox {
  left: number;
  top: number;
  span: number;
}

function areaAverage(sprite: SpriteArt, from: number, box: SourceBox): string | null {
  let red = 0;
  let green = 0;
  let blue = 0;
  let covered = 0;
  let sampled = 0;
  const firstColumn = Math.floor(box.left);
  const firstRow = Math.floor(box.top);
  const lastColumn = Math.min(from - 1, Math.ceil(box.left + box.span) - 1);
  const lastRow = Math.min(from - 1, Math.ceil(box.top + box.span) - 1);
  for (let row = firstRow; row <= lastRow; row++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      sampled += 1;
      const pixel = sprite[row * from + column];
      if (pixel === null || pixel === undefined) continue;
      const rgb = rgbOfHex(pixel);
      red += rgb.red;
      green += rgb.green;
      blue += rgb.blue;
      covered += 1;
    }
  }
  if (sampled === 0 || covered / sampled < OPAQUE_ENOUGH_TO_KEEP) return null;
  return hexOfRgb({ red: red / covered, green: green / covered, blue: blue / covered });
}

export function rgbOfHex(hex: string): Rgb {
  return {
    red: parseInt(hex.slice(1, 3), 16),
    green: parseInt(hex.slice(3, 5), 16),
    blue: parseInt(hex.slice(5, 7), 16),
  };
}

export function hexOfRgb(rgb: Rgb): string {
  return `#${channel(rgb.red)}${channel(rgb.green)}${channel(rgb.blue)}`;
}

function channel(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}
