import type { Marker, WorldSampler } from '../procgen/worldSampler';
import { pointOverlayLookup } from '../world/render/ascii/asciiCells';
import { viewportCenteredOn } from '../world/render/ascii/asciiViewport';
import type { ReadOnlyTileAssets } from '../frontend/readOnlyAssets';
import { FACING_NAMES } from '../world/facing';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
  clampSightRadiusTiles,
} from '../world/vision/characterSight';
import { BLANK_GLYPH, SELF_GLYPH, observedTileAt } from './observedTile';
import type { MarkerSource } from '../world/render/markerSource';
import {
  actionWithinReach,
  interactPrompt,
  type ActionOfferingCells,
} from '../world/puzzles/interaction/actionWithinReach';
import type { AgentMode, AgentPose } from './agentMode';

export interface ObservedOverlay extends MarkerSource, ActionOfferingCells {}

export const NO_OVERLAY: ObservedOverlay = { markersIn: () => [], actionAt: () => null };

export const GOD_VIEW_SIZE = 33;

export { BLANK_GLYPH, SELF_GLYPH, UNKNOWN_TILE_GLYPH } from './observedTile';

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
  interaction: string | null;
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
  overlay: ObservedOverlay = NO_OVERLAY,
): AgentObservation {
  const radius = clampSightRadiusTiles(sightRadiusTiles);
  const size = viewSizeFor(mode, radius);
  const viewport = viewportCenteredOn(pose.x, pose.y, size, size);
  const markers = pointOverlayLookup(sampler, viewport, overlay);
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
    interaction: interactPrompt(actionWithinReach(overlay, pose)),
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
  const observed = observedTileAt(
    sampler,
    tileAssets,
    markers,
    pose,
    mode,
    sightRadiusTiles,
    x,
    y,
  );
  if (theWholeGridSharesOneLegendEntryFor(observed.glyph)) return observed.glyph;
  return collectLegend(legend, observed.glyph, observed.meaning, observed.walkable);
}

function theWholeGridSharesOneLegendEntryFor(glyph: string): boolean {
  return glyph === SELF_GLYPH || glyph === BLANK_GLYPH;
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
