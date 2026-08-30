import { writeFileSync } from 'node:fs';
import { TILE_ART_SIZE } from '@/features/asset-library/tiles/art/artSize';
import type { CubeFace, CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import { fixtureLook } from '@/features/game/puzzles/fixtures/fixtureAppearance';
import type { PuzzleFixtureKind } from '@/features/game/puzzles/fixtures/puzzleFixture';
import { pngBuffer, type RgbImage } from './png/writePng';

const OUTPUT_PATH = 'docs/sokoban-fixture-art.png';
const SCALE = 6;
const GUTTER = 10;
const BACKDROP: Rgb = [18, 19, 22];
const FACES: CubeFace[] = ['top', 'north'];
const STATES: { kind: PuzzleFixtureKind; isOn: boolean }[] = [
  { kind: 'plate', isOn: false },
  { kind: 'plate', isOn: true },
  { kind: 'crate', isOn: false },
  { kind: 'crate', isOn: true },
  { kind: 'pillar', isOn: false },
];

type Rgb = [number, number, number];

const cell = TILE_ART_SIZE * SCALE + GUTTER;
const sheet: RgbImage = {
  width: cell * STATES.length,
  height: cell * FACES.length,
  pixelAt: (x, y) => facePixelAt(x, y) ?? BACKDROP,
};

writeFileSync(OUTPUT_PATH, pngBuffer(sheet));
console.log(`wrote ${STATES.length} fixture states to ${OUTPUT_PATH}`);

function facePixelAt(x: number, y: number): Rgb | null {
  const state = STATES[Math.floor(x / cell)];
  const face = FACES[Math.floor(y / cell)];
  if (!state || !face) return null;
  const art = fixtureLook(state.kind, state.isOn).faceArt;
  return art ? artPixelAt(art, face, (x % cell) - GUTTER / 2, (y % cell) - GUTTER / 2) : null;
}

function artPixelAt(art: CubeFaceArt, face: CubeFace, acrossCell: number, downCell: number): Rgb | null {
  const [x, y] = [Math.floor(acrossCell / SCALE), Math.floor(downCell / SCALE)];
  if (x < 0 || y < 0 || x >= art.size || y >= art.size) return null;
  const ink = art[face]?.[y * art.size + x];
  return ink ? hexToRgb(ink) : null;
}

function hexToRgb(ink: string): Rgb {
  const value = Number.parseInt(ink.slice(1, 7), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
