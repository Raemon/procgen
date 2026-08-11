import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { asciiCellAt, pointOverlayLookup, EMPTY_GLYPH } from './asciiCells';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../markerSource';
import { viewportCenteredOn, type AsciiViewport } from './asciiViewport';

export function asciiSnapshot(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  playerX: number,
  playerY: number,
  columns: number,
  rows: number,
  extraMarkers: MarkerSource = NO_EXTRA_MARKERS,
): string {
  const viewport = viewportCenteredOn(playerX, playerY, columns, rows);
  const markers = pointOverlayLookup(sampler, viewport, extraMarkers);
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    lines.push(snapshotRow(sampler, tileAssets, markers, viewport, playerX, playerY, row));
  }
  return lines.join('\n');
}

function snapshotRow(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
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
    line += asciiCellAt(sampler, tileAssets, markers, x, y, isPlayerHere)?.glyph ?? EMPTY_GLYPH;
  }
  return line;
}
