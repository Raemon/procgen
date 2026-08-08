import type { Marker, WorldSampler } from '../procgen/worldSampler';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { pointOverlayLookup } from '../world/render/ascii/asciiCells';
import { viewportCenteredOn } from '../world/render/ascii/asciiViewport';
import type { ReadOnlyTileAssets } from '../frontend/readOnlyAssets';
import { FACING_NAMES } from '../world/facing';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
  clampSightRadiusTiles,
  isWithinCharacterSight,
} from '../world/vision/characterSight';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../world/render/markerSource';
import type { AgentMode, AgentPose } from './agentMode';

export const GOD_VIEW_SIZE = 33;
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
  sightRadiusTiles: number | null;
  view: string[];
  legend: LegendEntry[];
}

export function viewSizeFor(
  mode: AgentMode,
  sightRadiusTiles: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
): number {
  return mode === 'god' ? GOD_VIEW_SIZE : characterViewSize(clampSightRadiusTiles(sightRadiusTiles));
}

export function buildObservation(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  pose: AgentPose,
  mode: AgentMode,
  sightRadiusTiles: number = DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  extraMarkers: MarkerSource = NO_EXTRA_MARKERS,
): AgentObservation {
  const radius = clampSightRadiusTiles(sightRadiusTiles);
  const size = viewSizeFor(mode, radius);
  const viewport = viewportCenteredOn(pose.x, pose.y, size, size);
  const markers = pointOverlayLookup(sampler, viewport, extraMarkers);
  const legend = new Map<string, LegendEntry>();
  addFixedLegendEntries(legend, mode, radius);
  const view: string[] = [];
  for (let row = 0; row < size; row++) {
    let line = '';
    for (let column = 0; column < size; column++) {
      const x = viewport.originX + column;
      const y = viewport.originY + row;
      line += observedGlyph(sampler, tileAssets, markers, legend, pose, mode, radius, x, y);
    }
    view.push(line);
  }
  return {
    mode,
    position: { x: pose.x, y: pose.y },
    facing: mode === 'god' ? FACING_NAMES[pose.facing] : null,
    viewSize: size,
    sightRadiusTiles: mode === 'character' ? radius : null,
    view,
    legend: [...legend.values()],
  };
}

function observedGlyph(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  markers: Map<string, Marker>,
  legend: Map<string, LegendEntry>,
  pose: AgentPose,
  mode: AgentMode,
  sightRadiusTiles: number,
  x: number,
  y: number,
): string {
  if (x === pose.x && y === pose.y) return SELF_GLYPH;
  if (
    mode === 'character' &&
    !isWithinCharacterSight(pose.facing, x - pose.x, y - pose.y, sightRadiusTiles)
  ) {
    return BLANK_GLYPH;
  }
  const marker = markers.get(`${x},${y}`);
  if (marker) return collectLegend(legend, marker.glyph, marker.tag, null);
  return tileGlyph(sampler, tileAssets, legend, x, y);
}

function tileGlyph(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  legend: Map<string, LegendEntry>,
  x: number,
  y: number,
): string {
  const tileId = sampler.tileAt(x, y);
  if (tileId === EMPTY_TILE) return BLANK_GLYPH;
  const tile = tileAssets.byId(tileId);
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

function addFixedLegendEntries(
  legend: Map<string, LegendEntry>,
  mode: AgentMode,
  sightRadiusTiles: number,
): void {
  legend.set(SELF_GLYPH, { glyph: SELF_GLYPH, meaning: 'you', walkable: null });
  legend.set(BLANK_GLYPH, {
    glyph: BLANK_GLYPH,
    meaning:
      mode === 'character'
        ? `nothing generated here, or unseen: behind you, or past your ${sightRadiusTiles}-tile sight radius (fog)`
        : 'nothing generated here',
    walkable: null,
  });
}
