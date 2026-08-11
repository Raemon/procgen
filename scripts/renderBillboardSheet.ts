import { writeFileSync } from 'node:fs';
import { TILE_ART_SIZE } from '../assets/tiles/art/artSize';
import { markerBillboardArt } from '../assets/tiles/art/billboards/markerBillboardArt';
import { defaultTiles } from '../assets/tiles/defaultTiles';
import type { TileDef } from '../assets/tiles/tileDef';
import { pngBuffer, type RgbImage } from './png/writePng';

const OUTPUT_PATH = 'docs/billboard-preview.png';
const SCALE = 8;
const GUTTER = 8;
const DUSK: Rgb = [22, 24, 34];
const PROP_NAMES = ['pine tree', 'oak tree', 'hedge', 'hazel bush', 'granite outcrop', 'meadow flowers'];
const RECOLOURS = ['#41663c', '#37603f', '#7a8f5a', '#4a6f7a', '#8b8c87', '#9a6f8a'];

type Rgb = [number, number, number];

const cell = TILE_ART_SIZE * SCALE + GUTTER;
const props = PROP_NAMES.map(tileNamed);
const columns = RECOLOURS.length;
const sheet: RgbImage = {
  width: cell * columns,
  height: cell * props.length,
  pixelAt: (x, y) => billboardPixelAt(x, y) ?? DUSK,
};

writeFileSync(OUTPUT_PATH, pngBuffer(sheet));
console.log(`wrote ${props.length} billboards in ${columns} tints to ${OUTPUT_PATH}`);

function billboardPixelAt(x: number, y: number): Rgb | null {
  const prop = props[Math.floor(y / cell)];
  const tint = RECOLOURS[Math.floor(x / cell)];
  if (!prop || tint === undefined) return null;
  return spritePixelAt(recoloured(prop, tint), (x % cell) - GUTTER / 2, (y % cell) - GUTTER / 2);
}

function spritePixelAt(tile: TileDef, acrossCell: number, downCell: number): Rgb | null {
  const [x, y] = [Math.floor(acrossCell / SCALE), Math.floor(downCell / SCALE)];
  if (x < 0 || y < 0 || x >= TILE_ART_SIZE || y >= TILE_ART_SIZE) return null;
  const ink = markerBillboardArt(tile).north?.[y * TILE_ART_SIZE + x];
  return ink ? overDusk(ink) : null;
}

function recoloured(tile: TileDef, color: string): TileDef {
  return { ...tile, color, id: tile.id + color.length * 1000 };
}

function tileNamed(name: string): TileDef {
  const tile = defaultTiles().find((one) => one.name === name);
  if (!tile) throw new Error(`no default tile named ${name}`);
  return tile;
}

function overDusk(ink: string): Rgb {
  const [red, green, blue] = hexToRgb(ink);
  const alpha = ink.length > 7 ? Number.parseInt(ink.slice(7, 9), 16) / 255 : 1;
  return [
    Math.round(DUSK[0] + (red - DUSK[0]) * alpha),
    Math.round(DUSK[1] + (green - DUSK[1]) * alpha),
    Math.round(DUSK[2] + (blue - DUSK[2]) * alpha),
  ];
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1, 7), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
