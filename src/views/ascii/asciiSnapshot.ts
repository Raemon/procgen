import type { Marker, WorldSampler } from '../../procgen/worldSampler';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';
import { asciiCellAt, markerLookup, EMPTY_GLYPH } from './asciiCells';
import { viewportCenteredOn, type AsciiViewport } from './asciiViewport';

export function asciiSnapshot(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  playerX: number,
  playerY: number,
  columns: number,
  rows: number,
): string {
  const viewport = viewportCenteredOn(playerX, playerY, columns, rows);
  const markers = markerLookup(sampler, viewport);
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    lines.push(snapshotRow(sampler, tileset, markers, viewport, playerX, playerY, row));
  }
  return lines.join('\n');
}

function snapshotRow(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  markers: Map<string, Marker>,
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
    line += asciiCellAt(sampler, tileset, markers, x, y, isPlayerHere)?.glyph ?? EMPTY_GLYPH;
  }
  return line;
}
