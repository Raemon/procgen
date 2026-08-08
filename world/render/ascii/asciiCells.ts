import type { Marker, WorldSampler } from '../../../procgen/worldSampler';
import { EMPTY_TILE } from '../../../procgen/values/chunkValues';
import type { ReadOnlyTileAssets } from '../../../frontend/readOnlyAssets';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../markerSource';
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

export function pointOverlayLookup(
  sampler: WorldSampler,
  viewport: AsciiViewport,
  extraMarkers: MarkerSource = NO_EXTRA_MARKERS,
): Map<string, Marker> {
  const maxX = viewport.originX + viewport.columns - 1;
  const maxY = viewport.originY + viewport.rows - 1;
  const lookup = new Map<string, Marker>();
  for (const marker of sampler.markersIn(viewport.originX, viewport.originY, maxX, maxY)) {
    lookup.set(`${marker.x},${marker.y}`, marker);
  }
  for (const spawn of sampler.itemSpawnsIn(viewport.originX, viewport.originY, maxX, maxY)) {
    lookup.set(`${spawn.x},${spawn.y}`, { ...spawn, faceArt: null, tag: spawn.name });
  }
  for (const marker of extraMarkers.markersIn(viewport.originX, viewport.originY, maxX, maxY)) {
    lookup.set(`${marker.x},${marker.y}`, marker);
  }
  return lookup;
}

export function asciiCellAt(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  markers: Map<string, Marker>,
  x: number,
  y: number,
  isPlayerHere: boolean,
): AsciiCell | null {
  if (isPlayerHere) return { glyph: PLAYER_GLYPH, ink: PLAYER_INK };
  const marker = markers.get(`${x},${y}`);
  if (marker) return { glyph: marker.glyph, ink: marker.color };
  return tileCell(sampler, tileAssets, x, y);
}

function tileCell(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): AsciiCell | null {
  const tileId = visibleTileAt(sampler, x, y);
  if (tileId === EMPTY_TILE) return null;
  const tile = tileAssets.byId(tileId);
  return { glyph: tile?.symbol ?? UNKNOWN_GLYPH, ink: tile?.color ?? UNKNOWN_INK };
}

function visibleTileAt(sampler: WorldSampler, x: number, y: number): number {
  const topVoxel = sampler.topVoxelAt(x, y);
  return topVoxel === EMPTY_TILE ? sampler.tileAt(x, y) : topVoxel;
}
