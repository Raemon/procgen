import { writeFileSync } from 'node:fs';
import { dwarfSprite } from '../dwarf/dwarfSprite';
import { idleDwarfPose, walkingDwarfPose } from '../dwarf/dwarfPose';
import { CHARACTER_ROTATIONS } from '@/features/asset-library/characters/characterBillboard';
import { spriteGridSize, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import { pngBuffer } from '../../../scripts/png/writePng';

const OUTPUT_PATH = 'docs/dwarf-portrait.png';
const SCALE = 3;
const BACKGROUND: Rgb = [14, 16, 22];

type Rgb = [number, number, number];

const poses = [idleDwarfPose(0), idleDwarfPose(0.5), walkingDwarfPose(0.25), walkingDwarfPose(0.75)];
const sprites = CHARACTER_ROTATIONS.flatMap((rotation) =>
  poses.map((pose) => dwarfSprite(rotation, pose)),
);
const cell = spriteGridSize(sprites[0]!) * SCALE;
const columns = poses.length;
const width = cell * columns;
const height = cell * CHARACTER_ROTATIONS.length;
const pixels = blankSheet(width, height);

sprites.forEach((sprite, index) => {
  drawSprite(sprite, (index % columns) * cell, Math.floor(index / columns) * cell);
});

writeFileSync(OUTPUT_PATH, pngBuffer({ width, height, pixelAt }));
console.log(`wrote ${width}x${height} to ${OUTPUT_PATH}`);

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
