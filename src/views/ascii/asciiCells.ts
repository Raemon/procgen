import type { Marker, WorldSampler } from '../../procgen/worldSampler';
import { EMPTY_TILE } from '../../procgen/values/chunkValues';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';
import type { AsciiViewport } from './asciiViewport';

export const PLAYER_GLYPH = '@';
export const EMPTY_GLYPH = ' ';
export const UNKNOWN_GLYPH = '?';
export const PLAYER_INK = '#ffd86a';
export const UNKNOWN_INK = '#555555';

export interface AsciiCell {
  glyph: string;
  ink: string;
}

export function markerLookup(sampler: WorldSampler, viewport: AsciiViewport): Map<string, Marker> {
  const lookup = new Map<string, Marker>();
  const markers = sampler.markersIn(
    viewport.originX,
    viewport.originY,
    viewport.originX + viewport.columns - 1,
    viewport.originY + viewport.rows - 1,
  );
  for (const marker of markers) lookup.set(`${marker.x},${marker.y}`, marker);
  return lookup;
}

export function asciiCellAt(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  markers: Map<string, Marker>,
  x: number,
  y: number,
  isPlayerHere: boolean,
): AsciiCell | null {
  if (isPlayerHere) return { glyph: PLAYER_GLYPH, ink: PLAYER_INK };
  const marker = markers.get(`${x},${y}`);
  if (marker) return { glyph: marker.glyph, ink: marker.color };
  return tileCell(sampler, tileset, x, y);
}

function tileCell(
  sampler: WorldSampler,
  tileset: ReadOnlyTileset,
  x: number,
  y: number,
): AsciiCell | null {
  const tileId = visibleTileAt(sampler, x, y);
  if (tileId === EMPTY_TILE) return null;
  const tile = tileset.byId(tileId);
  return { glyph: tile?.symbol ?? UNKNOWN_GLYPH, ink: tile?.color ?? UNKNOWN_INK };
}

function visibleTileAt(sampler: WorldSampler, x: number, y: number): number {
  const topVoxel = sampler.topVoxelAt(x, y);
  return topVoxel === EMPTY_TILE ? sampler.tileAt(x, y) : topVoxel;
}
