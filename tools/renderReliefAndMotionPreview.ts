import { writeFileSync } from 'node:fs';
import { defaultTiles } from '../assets/tiles/defaultTiles';
import { faceArtPlan } from '../assets/tiles/faceArtFacePlan';
import { facePixelsAt, frameCount } from '../assets/tiles/faceArtFrames';
import { heightOfInk } from '../assets/tiles/faceArtHeight';
import { faceGridSize, type CubeFaceArt, type FacePixels } from '../assets/tiles/tileFaceArt';
import type { TileDef } from '../assets/tiles/tileDef';
import {
  blankSheet,
  hexToRgb,
  putPixel,
  sheetPixelAt,
  type PixelSheet,
  type Rgb,
} from './png/pixelSheet';
import { pngBuffer } from './png/writePng';

const OUTPUT_PATH = 'docs/relief-and-motion-preview.png';
const SCALE = 2;
const TILE_PIXELS = 32;
const REPEATS = 2;
const PANEL = TILE_PIXELS * REPEATS * SCALE;
const GAP = 6;
const SUN: [number, number, number] = [-0.55, -0.55, 0.63];
const AMBIENT = 0.42;
const BACKGROUND: Rgb = [24, 24, 28];

interface Panel {
  color: FacePixels;
  height: FacePixels;
  baseColor: string;
}

const rows = defaultTiles().flatMap(previewRow).filter((row) => row.panels.length > 0);
const columns = Math.max(...rows.map((row) => row.panels.length));
const sheet = blankSheet(
  columns * (PANEL + GAP) + GAP,
  rows.length * (PANEL + GAP) + GAP,
  BACKGROUND,
);

rows.forEach((row, rowIndex) =>
  row.panels.forEach((panel, columnIndex) =>
    drawPanel(sheet, panel, GAP + columnIndex * (PANEL + GAP), GAP + rowIndex * (PANEL + GAP)),
  ),
);

writeFileSync(OUTPUT_PATH, pngBuffer({ ...sheet, pixelAt: sheetPixelAt(sheet) }));
console.log(`wrote ${rows.length} tiles of relief and motion to ${OUTPUT_PATH}`);

function previewRow(tile: TileDef): { panels: Panel[] } {
  const art = tile.faceArt;
  if (!art || !worthShowing(art)) return { panels: [] };
  return { panels: [...Array(frameCount(art)).keys()].map((frame) => topPanel(tile, art, frame)) };
}

function worthShowing(art: CubeFaceArt): boolean {
  return frameCount(art) > 1 || faceArtPlan(art, 'top').embossed;
}

function topPanel(tile: TileDef, art: CubeFaceArt, frame: number): Panel {
  return {
    color: facePixelsAt(art, { face: 'top', frame, layer: 'color' }),
    height: facePixelsAt(art, { face: 'top', frame, layer: 'height' }),
    baseColor: tile.color,
  };
}

function drawPanel(sheet: PixelSheet, panel: Panel, originX: number, originY: number): void {
  const size = faceGridSize(panel.color);
  const heights = panel.height.map(heightOfInk);
  for (let y = 0; y < PANEL; y++)
    for (let x = 0; x < PANEL; x++) {
      const index = sourceIndex(x, y, size);
      const ink = panel.color[index] ?? panel.baseColor;
      putPixel(sheet, originX + x, originY + y, litPixel(ink, heights, size, index));
    }
}

function litPixel(ink: string, heights: number[], size: number, index: number): Rgb {
  const light = lightAt(heights, size, index % size, Math.floor(index / size));
  return hexToRgb(ink).map((channel) => Math.min(255, Math.round(channel * light))) as Rgb;
}

function lightAt(heights: number[], size: number, x: number, y: number): number {
  const alongU = heightAt(heights, size, x + 1, y) - heightAt(heights, size, x - 1, y);
  const alongV = heightAt(heights, size, x, y + 1) - heightAt(heights, size, x, y - 1);
  const normal = unitNormal(-alongU * 3, alongV * 3);
  const facing = Math.max(0, normal[0] * SUN[0] + normal[1] * SUN[1] + normal[2] * SUN[2]);
  return AMBIENT + (1 - AMBIENT) * facing;
}

function unitNormal(x: number, y: number): [number, number, number] {
  const length = Math.hypot(x, y, 1);
  return [x / length, y / length, 1 / length];
}

function heightAt(heights: number[], size: number, x: number, y: number): number {
  const wrappedX = ((x % size) + size) % size;
  const wrappedY = ((y % size) + size) % size;
  return heights[wrappedY * size + wrappedX] ?? 0.5;
}

function sourceIndex(x: number, y: number, size: number): number {
  return (Math.floor(y / SCALE) % size) * size + (Math.floor(x / SCALE) % size);
}
