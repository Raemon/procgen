import { writeFileSync } from 'node:fs';
import { humanoidBillboard } from '../humanoid/humanoidBillboard';
import { WANDERING_TRADER_PALETTE } from '../humanoid/humanoidPalette';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
} from '@/features/asset-library/characters/characterBillboard';
import { spriteGridSize, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import { pngBuffer } from '../../../scripts/png/writePng';

const OUTPUT_PATH = 'docs/character-sheet-preview.png';
const SCALE = 4;
const PADDING = 4;
const BACKGROUND: Rgb = [24, 24, 28];

type Rgb = [number, number, number];

const billboard = humanoidBillboard(WANDERING_TRADER_PALETTE);
const rows = CHARACTER_ROTATIONS.flatMap((rotation) =>
  CHARACTER_ANIMATIONS.map((animation) => framesOf(billboard, rotation, animation)),
);
const cell = spriteGridSize(rows[0]![0]!) * SCALE + PADDING;
const columns = Math.max(...rows.map((frames) => frames.length));
const width = cell * columns;
const height = cell * rows.length;
const pixels = blankSheet(width, height);

rows.forEach((frames, row) => {
  frames.forEach((frame, column) => drawSprite(frame, column * cell + PADDING / 2, row * cell + PADDING / 2));
});

writeFileSync(OUTPUT_PATH, pngBuffer({ width, height, pixelAt }));
console.log(`wrote ${rows.length} clips to ${OUTPUT_PATH}`);

function drawSprite(sprite: SpriteArt, originX: number, originY: number): void {
  const size = spriteGridSize(sprite);
  for (let y = 0; y < size * SCALE; y++) {
    for (let x = 0; x < size * SCALE; x++) {
      const source = sprite[Math.floor(y / SCALE) * size + Math.floor(x / SCALE)];
      if (source) putPixel(originX + x, originY + y, hexToRgb(source));
    }
  }
}

function blankSheet(sheetWidth: number, sheetHeight: number): Uint8Array {
  const sheet = new Uint8Array(sheetWidth * sheetHeight * 3);
  for (let index = 0; index < sheetWidth * sheetHeight; index++) sheet.set(BACKGROUND, index * 3);
  return sheet;
}

function putPixel(x: number, y: number, color: Rgb): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  pixels.set(color, (y * width + x) * 3);
}

function pixelAt(x: number, y: number): Rgb {
  const offset = (y * width + x) * 3;
  return [pixels[offset] ?? 0, pixels[offset + 1] ?? 0, pixels[offset + 2] ?? 0];
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
