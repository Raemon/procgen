import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { pointOverlayLookup } from '@/features/game/render/ascii/asciiCells';
import { viewportCenteredOn } from '@/features/game/render/ascii/asciiViewport';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { FACING_NAMES } from '@/features/game/facing';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
  clampSightRadiusTiles,
} from '@/features/game/vision/characterSight';
import { BLANK_GLYPH, SELF_GLYPH, agentCanSee, observedTileAt } from './observedTile';
import { terrainSightlineFor, type TerrainSightline } from './terrainSightline';
import type { MarkerSource } from '@/features/game/render/markerSource';
import {
  actionWithinReach,
  interactPrompt,
  type ActionOfferingCells,
} from '@/features/game/puzzles/interaction/actionWithinReach';
import type { AgentMode, AgentPose } from './agentMode';

export interface ObservedOverlay extends MarkerSource, ActionOfferingCells {}

export const NO_OVERLAY: ObservedOverlay = { markersIn: () => [], actionAt: () => null };

export const GOD_VIEW_SIZE = 33;

export { SELF_GLYPH } from './observedTile';

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
  elevation: string[] | null;
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
  const seesPast = terrainSightlineFor(sampler, tileAssets, pose, mode, radius);
  const legend = new Map<string, LegendEntry>();
  addFixedLegendEntries(legend, mode, radius);
  const view: string[] = [];
  const heights: string[] = [];
  const digitsSeen = new Set<string>();
  for (let row = 0; row < size; row++) {
    let line = '';
    let heightLine = '';
    for (let column = 0; column < size; column++) {
      const x = viewport.originX + column;
      const y = viewport.originY + row;
      const seen = cellIsSeen(pose, mode, radius, seesPast, x, y);
      line += seen
        ? observedGlyph(sampler, tileAssets, markers, legend, pose, mode, radius, x, y)
        : BLANK_GLYPH;
      const digit = seen ? elevationDigit(sampler.elevationAt(x, y)) : BLANK_GLYPH;
      heightLine += digit;
      if (seen) digitsSeen.add(digit);
    }
    view.push(line);
    heights.push(heightLine);
  }
  return {
    mode,
    position: { x: pose.x, y: pose.y },
    facing: mode === 'god' ? FACING_NAMES[pose.facing] : null,
    viewSize: size,
    sightRadiusTiles: mode === 'character' ? radius : null,
    view,
    elevation: digitsSeen.size > 1 ? heights : null,
    legend: [...legend.values()],
    interaction: interactPrompt(actionWithinReach(overlay, pose)),
  };
}

function cellIsSeen(
  pose: AgentPose,
  mode: AgentMode,
  sightRadiusTiles: number,
  seesPast: TerrainSightline,
  x: number,
  y: number,
): boolean {
  if (x === pose.x && y === pose.y) return true;
  return agentCanSee(mode, pose, sightRadiusTiles, x, y) && seesPast(x, y);
}

const TALLEST_ELEVATION_DIGIT = 35;

function elevationDigit(elevation: number): string {
  return Math.min(TALLEST_ELEVATION_DIGIT, Math.max(0, Math.round(elevation))).toString(36);
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
  const observed = observedTileAt(sampler, tileAssets, markers, pose, mode, sightRadiusTiles, x, y);
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
        ? `nothing generated here, or unseen: behind you, past your ${sightRadiusTiles}-tile sight radius (fog), or hidden behind tall ground or a ridge above you`
        : 'nothing generated here',
    walkable: null,
  });
}
