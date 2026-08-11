import { writeFileSync } from 'node:fs';
import { dwarfBillboard } from '../assets/characters/dwarf/dwarfBillboard';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
} from '../assets/characters/characterBillboard';
import { spriteGridSize, type SpriteArt } from '../assets/tiles/spriteArt';
import { pngBuffer } from './png/writePng';

const OUTPUT_PATH = 'docs/dwarf-character-sheet.png';
const BACKGROUND: Rgb = [14, 16, 22];

type Rgb = [number, number, number];

const startedAt = Date.now();
const billboard = dwarfBillboard();
const builtInMs = Date.now() - startedAt;

const rows = CHARACTER_ROTATIONS.flatMap((rotation) =>
  CHARACTER_ANIMATIONS.map((animation) => framesOf(billboard, rotation, animation)),
);
const cell = spriteGridSize(rows[0]![0]!);
const columns = Math.max(...rows.map((frames) => frames.length));
const width = cell * columns;
const height = cell * rows.length;
const pixels = blankSheet(width, height);

rows.forEach((frames, row) => {
  frames.forEach((frame, column) => drawSprite(frame, column * cell, row * cell));
});

writeFileSync(OUTPUT_PATH, pngBuffer({ width, height, pixelAt }));
console.log(`built ${rows.length} clips in ${builtInMs}ms; wrote ${width}x${height} to ${OUTPUT_PATH}`);

function drawSprite(sprite: SpriteArt, originX: number, originY: number): void {
  const size = spriteGridSize(sprite);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const source = sprite[y * size + x];
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
