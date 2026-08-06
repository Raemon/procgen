import type { WorldSampler } from '../../procgen/worldSampler';
import type { Tileset } from '../../world/tiles/tileset';
import {
  asciiCellAt,
  emptyOverlays,
  markerLookup,
  EMPTY_GLYPH,
  type AsciiOverlays,
} from './asciiCells';
import { viewportCenteredOn, type AsciiViewport } from './asciiViewport';

export function asciiSnapshot(
  sampler: WorldSampler,
  tileset: Tileset,
  playerX: number,
  playerY: number,
  columns: number,
  rows: number,
): string {
  const viewport = viewportCenteredOn(playerX, playerY, columns, rows);
  const overlays = { ...emptyOverlays(), markers: markerLookup(sampler, viewport) };
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    lines.push(snapshotRow(sampler, tileset, overlays, viewport, playerX, playerY, row));
  }
  return lines.join('\n');
}

function snapshotRow(
  sampler: WorldSampler,
  tileset: Tileset,
  overlays: AsciiOverlays,
  viewport: AsciiViewport,
  playerX: number,
  playerY: number,
  row: number,
): string {
  let line = '';
  for (let column = 0; column < viewport.columns; column++) {
    const x = viewport.originX + column;
    const y = viewport.originY + row;
    const isPlayerHere = x === playerX && y === playerY;
    line += asciiCellAt(sampler, tileset, overlays, x, y, isPlayerHere)?.glyph ?? EMPTY_GLYPH;
  }
  return line;
}
