import { writeFileSync } from 'node:fs';
import { defaultTiles } from '../library/tiles/defaultTiles';
import type { TileDef } from '../library/tiles/tileDef';
import { faceGridSize, type FacePixels } from '../library/tiles/tileFaceArt';
import { pngBuffer } from './png/writePng';

const OUTPUT_PATH = 'docs/tileset-preview.png';
const SCALE = 3;
const COLUMNS = 4;
const BACKGROUND: Rgb = [24, 24, 28];

type Rgb = [number, number, number];

interface Sheet {
  width: number;
  height: number;
  pixels: Uint8Array;
}

const tiles = defaultTiles();
const cellWidth = 32 * 3 * SCALE + 12;
const cellHeight = 32 * 2 * SCALE + 12;
const sheet = blankSheet(
  cellWidth * COLUMNS,
  cellHeight * Math.ceil(tiles.length / COLUMNS),
);

tiles.forEach((tile, index) => {
  const originX = (index % COLUMNS) * cellWidth + 6;
  const originY = Math.floor(index / COLUMNS) * cellHeight + 6;
  drawTiledFace(tile, tile.faceArt?.top, originX, originY, 2);
  drawTiledFace(tile, tile.faceArt?.north, originX + 32 * 2 * SCALE + 4, originY, 1);
});

writeFileSync(OUTPUT_PATH, pngBuffer({ ...sheet, pixelAt: sheetPixelAt }));
console.log(`wrote preview of ${tiles.length} tiles to ${OUTPUT_PATH}`);

function drawTiledFace(
  tile: TileDef,
  face: FacePixels | undefined,
  originX: number,
  originY: number,
  repeats: number,
): void {
  if (!face) return;
  const size = faceGridSize(face);
  for (let y = 0; y < size * repeats * SCALE; y++) {
    for (let x = 0; x < size * repeats * SCALE; x++) {
      const source = face[sourceIndex(x, y, size)] ?? tile.color;
      putPixel(originX + x, originY + y, hexToRgb(source));
    }
  }
}

function sourceIndex(x: number, y: number, size: number): number {
  return (Math.floor(y / SCALE) % size) * size + (Math.floor(x / SCALE) % size);
}

function blankSheet(width: number, height: number): Sheet {
  const pixels = new Uint8Array(width * height * 3);
  for (let index = 0; index < width * height; index++) pixels.set(BACKGROUND, index * 3);
  return { width, height, pixels };
}

function putPixel(x: number, y: number, color: Rgb): void {
  if (x < 0 || y < 0 || x >= sheet.width || y >= sheet.height) return;
  sheet.pixels.set(color, (y * sheet.width + x) * 3);
}

function sheetPixelAt(x: number, y: number): Rgb {
  const offset = (y * sheet.width + x) * 3;
  return [sheet.pixels[offset] ?? 0, sheet.pixels[offset + 1] ?? 0, sheet.pixels[offset + 2] ?? 0];
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
