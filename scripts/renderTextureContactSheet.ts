import { writeFileSync } from 'node:fs';
import { MATERIAL_SYNTHS } from '@/features/asset-library/textures/materialCatalog';
import type { MaterialSynth } from '@/features/asset-library/textures/materialSynth';
import { pngBuffer, type RgbImage } from './png/writePng';

const CELL = 256;
const COLUMNS = 5;

writeFileSync('public/textures/contactSheet.png', pngBuffer(sheetImage()));
console.log(sheetLegend());

function sheetImage(): RgbImage {
  const rows = Math.ceil(MATERIAL_SYNTHS.length / COLUMNS);
  return {
    width: COLUMNS * CELL,
    height: rows * CELL,
    pixelAt: sheetPixel,
  };
}

function sheetPixel(x: number, y: number): [number, number, number] {
  const material = materialForCell(Math.floor(x / CELL), Math.floor(y / CELL));
  if (!material) return [24, 24, 24];
  return material.colorAt(((x % CELL) * 2) / CELL % 1, ((y % CELL) * 2) / CELL % 1, material.faces[0]!);
}

function materialForCell(column: number, row: number): MaterialSynth | undefined {
  return MATERIAL_SYNTHS[row * COLUMNS + column];
}

function sheetLegend(): string {
  return MATERIAL_SYNTHS.map(
    (material, index) =>
      `${Math.floor(index / COLUMNS)},${index % COLUMNS}: ${material.id}`,
  ).join('\n');
}
