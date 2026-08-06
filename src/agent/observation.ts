import type { Marker, WorldSampler } from '../procgen/worldSampler';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import type { QuestInventory } from '../quest/questInventory';
import { doorIdOfTag, keyIdOfTag, keyTagFor } from '../quest/questTags';
import { markerLookup } from '../views/ascii/asciiCells';
import { viewportCenteredOn } from '../views/ascii/asciiViewport';
import type { Tileset } from '../world/tiles/tileset';
import { FACING_NAMES, isInFrontHalfPlane } from '../world/facing';
import type { AgentMode, AgentPose } from './agentMode';

export const GOD_VIEW_SIZE = 33;
export const CHARACTER_VIEW_SIZE = 15;
export const SELF_GLYPH = '@';
export const BLANK_GLYPH = ' ';
export const UNKNOWN_TILE_GLYPH = '?';

export interface LegendEntry {
  glyph: string;
  meaning: string;
  walkable: boolean | null;
}

export interface AgentObservation {
  mode: AgentMode;
  position: { x: number; y: number };
  facing: (typeof FACING_NAMES)[number] | null;
  viewSize: number;
  view: string[];
  legend: LegendEntry[];
  keysHeld: string[];
}

export function viewSizeFor(mode: AgentMode): number {
  return mode === 'god' ? GOD_VIEW_SIZE : CHARACTER_VIEW_SIZE;
}

export function buildObservation(
  sampler: WorldSampler,
  tileset: Tileset,
  pose: AgentPose,
  mode: AgentMode,
  inventory?: QuestInventory,
): AgentObservation {
  const size = viewSizeFor(mode);
  const viewport = viewportCenteredOn(pose.x, pose.y, size, size);
  const markers = markerLookup(sampler, viewport);
  const legend = new Map<string, LegendEntry>();
  addFixedLegendEntries(legend, mode);
  const view: string[] = [];
  for (let row = 0; row < size; row++) {
    let line = '';
    for (let column = 0; column < size; column++) {
      const x = viewport.originX + column;
      const y = viewport.originY + row;
      line += observedGlyph(sampler, tileset, markers, legend, pose, mode, inventory, x, y);
    }
    view.push(line);
  }
  return {
    mode,
    position: { x: pose.x, y: pose.y },
    facing: mode === 'god' ? FACING_NAMES[pose.facing] : null,
    viewSize: size,
    view,
    legend: [...legend.values()],
    keysHeld: inventory?.keysHeld() ?? [],
  };
}

function observedGlyph(
  sampler: WorldSampler,
  tileset: Tileset,
  markers: Map<string, Marker>,
  legend: Map<string, LegendEntry>,
  pose: AgentPose,
  mode: AgentMode,
  inventory: QuestInventory | undefined,
  x: number,
  y: number,
): string {
  if (x === pose.x && y === pose.y) return SELF_GLYPH;
  if (mode === 'character' && !isInFrontHalfPlane(pose.facing, x - pose.x, y - pose.y)) {
    return BLANK_GLYPH;
  }
  const marker = markers.get(`${x},${y}`);
  if (marker) {
    return collectLegend(
      legend,
      marker.glyph,
      questMarkerMeaning(marker.tag, inventory),
      questMarkerWalkable(marker.tag, inventory),
    );
  }
  return tileGlyph(sampler, tileset, legend, x, y);
}

function questMarkerMeaning(tag: string, inventory: QuestInventory | undefined): string {
  const doorId = doorIdOfTag(tag);
  if (doorId !== null) {
    return inventory?.has(doorId)
      ? `${tag} — a door, unlocked for you`
      : `${tag} — a locked door; hold ${keyTagFor(doorId)} to pass`;
  }
  const keyId = keyIdOfTag(tag);
  if (keyId !== null) {
    return inventory?.has(keyId)
      ? `${tag} — a key you already took`
      : `${tag} — a key; step onto it to take it`;
  }
  return tag;
}

function questMarkerWalkable(tag: string, inventory: QuestInventory | undefined): boolean | null {
  const doorId = doorIdOfTag(tag);
  if (doorId === null) return null;
  return inventory?.has(doorId) ? null : false;
}

function tileGlyph(
  sampler: WorldSampler,
  tileset: Tileset,
  legend: Map<string, LegendEntry>,
  x: number,
  y: number,
): string {
  const tileId = sampler.tileAt(x, y);
  if (tileId === EMPTY_TILE) return BLANK_GLYPH;
  const tile = tileset.byId(tileId);
  if (!tile) return collectLegend(legend, UNKNOWN_TILE_GLYPH, 'unrecognized tile', null);
  return collectLegend(legend, tile.symbol, tile.name, tile.walkable);
}

function collectLegend(
  legend: Map<string, LegendEntry>,
  glyph: string,
  meaning: string,
  walkable: boolean | null,
): string {
  const existing = legend.get(glyph);
  if (!existing) legend.set(glyph, { glyph, meaning, walkable });
  else if (!existing.meaning.split(' / ').includes(meaning)) {
    existing.meaning += ` / ${meaning}`;
  }
  return glyph;
}

function addFixedLegendEntries(legend: Map<string, LegendEntry>, mode: AgentMode): void {
  legend.set(SELF_GLYPH, { glyph: SELF_GLYPH, meaning: 'you', walkable: null });
  legend.set(BLANK_GLYPH, {
    glyph: BLANK_GLYPH,
    meaning:
      mode === 'character'
        ? 'nothing generated here, or behind you (out of view)'
        : 'nothing generated here',
    walkable: null,
  });
}
