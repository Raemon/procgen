import type { CreatureLibrary } from '../../creatures/creatureLibrary';
import type { CreatureSim } from '../../creatures/sim/creatureSim';
import type { Marker, WorldSampler } from '../../procgen/worldSampler';
import { EMPTY_TILE } from '../../procgen/values/chunkValues';
import type { Tileset } from '../../world/tiles/tileset';
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

export interface AsciiOverlays {
  markers: Map<string, Marker>;
  creatures: Map<string, AsciiCell>;
}

export function emptyOverlays(): AsciiOverlays {
  return { markers: new Map(), creatures: new Map() };
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

export function creatureLookup(
  sim: CreatureSim,
  library: CreatureLibrary,
): Map<string, AsciiCell> {
  const lookup = new Map<string, AsciiCell>();
  for (const creature of sim.active()) {
    const def = library.byId(creature.creatureId);
    if (!def) continue;
    lookup.set(`${Math.round(creature.x)},${Math.round(creature.y)}`, {
      glyph: def.symbol,
      ink: def.color,
    });
  }
  return lookup;
}

export function asciiCellAt(
  sampler: WorldSampler,
  tileset: Tileset,
  overlays: AsciiOverlays,
  x: number,
  y: number,
  isPlayerHere: boolean,
): AsciiCell | null {
  if (isPlayerHere) return { glyph: PLAYER_GLYPH, ink: PLAYER_INK };
  const key = `${x},${y}`;
  const creature = overlays.creatures.get(key);
  if (creature) return creature;
  const marker = overlays.markers.get(key);
  if (marker) return { glyph: marker.glyph, ink: marker.color };
  return tileCell(sampler, tileset, x, y);
}

function tileCell(
  sampler: WorldSampler,
  tileset: Tileset,
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
