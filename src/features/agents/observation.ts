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
import {
  DEFAULT_GOD_VIEW_SIZE_TILES,
  clampGodViewSizeTiles,
} from '@/features/game/vision/godViewSize';
import {
  BLANK_GLYPH,
  SELF_GLYPH,
  agentCanSee,
  observedTileAt,
  rememberedGroundAt,
  whyItIsUnseen,
} from './observedTile';
import { sightWindowFor } from './terrainSightline';
import type { SightWindow } from '@/features/game/vision/lineOfSight';
import type { ExploredCells } from '@/features/game/vision/exploredCells';
import type { MarkerSource } from '@/features/game/render/markerSource';
import {
  actionWithinReach,
  interactPrompt,
  type ActionOfferingCells,
} from '@/features/game/fixtures/actionWithinReach';
import { remembersWhatItHasSeen, seesTheWholeWindow, type AgentMode, type AgentPose } from './agentMode';
import { climbStepsOf } from '@/features/game/climbing';

export interface ObservedOverlay extends MarkerSource, ActionOfferingCells {}

export const NO_OVERLAY: ObservedOverlay = { markersIn: () => [], actionAt: () => null };

export { SELF_GLYPH } from './observedTile';

export interface LegendEntry {
  glyph: string;
  meaning: string;
  walkable: boolean | null;
}

export interface ViewVision {
  sightRadiusTiles?: number;
  godViewSizeTiles?: number;
  explored?: ExploredCells | null;
}

export interface AgentObservation {
  mode: AgentMode;
  position: { x: number; y: number };
  facing: (typeof FACING_NAMES)[number] | null;
  viewSize: number;
  sightRadiusTiles: number | null;
  godViewSizeTiles: number | null;
  view: string[];
  inSight: string[] | null;
  elevation: string[] | null;
  elevationFloorSteps: number | null;
  legend: LegendEntry[];
  interaction: string | null;
}

export function viewSizeFor(mode: AgentMode, vision: ViewVision = {}): number {
  return seesTheWholeWindow(mode)
    ? godViewSizeOf(vision)
    : characterViewSize(sightRadiusOf(vision));
}

export function sightRadiusOf(vision: ViewVision): number {
  return clampSightRadiusTiles(vision.sightRadiusTiles ?? DEFAULT_CHARACTER_SIGHT_RADIUS_TILES);
}

export function godViewSizeOf(vision: ViewVision): number {
  return clampGodViewSizeTiles(vision.godViewSizeTiles ?? DEFAULT_GOD_VIEW_SIZE_TILES);
}

export function buildObservation(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  pose: AgentPose,
  mode: AgentMode,
  vision: ViewVision = {},
  overlay: ObservedOverlay = NO_OVERLAY,
): AgentObservation {
  const radius = sightRadiusOf(vision);
  const size = viewSizeFor(mode, vision);
  const viewport = viewportCenteredOn(pose.x, pose.y, size, size);
  const markers = pointOverlayLookup(sampler, viewport, overlay);
  const sight = sightWindowFor(sampler, tileAssets, pose, mode, radius, vision.explored ?? null);
  const remembers = remembersWhatItHasSeen(mode);
  const legend = new Map<string, LegendEntry>();
  addFixedLegendEntries(legend, mode, radius);
  const view: string[] = [];
  const knownRows: string[] = [];
  const stepsSeen: (number | null)[][] = [];
  for (let row = 0; row < size; row++) {
    let line = '';
    let knownLine = '';
    const stepsRow: (number | null)[] = [];
    for (let column = 0; column < size; column++) {
      const x = viewport.originX + column;
      const y = viewport.originY + row;
      const known = knowledgeOfCell(pose, mode, radius, sight, remembers, x, y);
      line += glyphForKnowledge(
        { sampler, tileAssets, markers, legend, pose, mode, radius },
        known,
        x,
        y,
      );
      knownLine += KNOWLEDGE_GLYPHS[known];
      stepsRow.push(known === 'hidden' ? null : climbStepsOf(sampler.elevationAt(x, y)));
    }
    view.push(line);
    knownRows.push(knownLine);
    stepsSeen.push(stepsRow);
  }
  const ground = elevationGrid(stepsSeen);
  return {
    mode,
    position: { x: pose.x, y: pose.y },
    facing: seesTheWholeWindow(mode) ? FACING_NAMES[pose.facing] : null,
    viewSize: size,
    sightRadiusTiles: seesTheWholeWindow(mode) ? null : radius,
    godViewSizeTiles: seesTheWholeWindow(mode) ? size : null,
    view,
    inSight: remembers ? knownRows : null,
    elevation: ground?.rows ?? null,
    elevationFloorSteps: ground?.floorSteps ?? null,
    legend: [...legend.values()],
    interaction: interactPrompt(actionWithinReach(overlay, pose)),
  };
}

export type CellKnowledge = 'sight' | 'memory' | 'hidden';

export const KNOWLEDGE_GLYPHS: Readonly<Record<CellKnowledge, string>> = {
  sight: '#',
  memory: '-',
  hidden: ' ',
};

interface ObservedCellParts {
  sampler: WorldSampler;
  tileAssets: ReadOnlyTileAssets;
  markers: Map<string, Marker>;
  legend: Map<string, LegendEntry>;
  pose: AgentPose;
  mode: AgentMode;
  radius: number;
}

function glyphForKnowledge(
  parts: ObservedCellParts,
  known: CellKnowledge,
  x: number,
  y: number,
): string {
  const { sampler, tileAssets, markers, legend, pose, mode, radius } = parts;
  if (known === 'hidden') return BLANK_GLYPH;
  if (known === 'memory') {
    const observed = rememberedGroundAt(sampler, tileAssets, x, y);
    return collectGlyph(legend, observed.glyph, observed.meaning, observed.walkable);
  }
  return observedGlyph(sampler, tileAssets, markers, legend, pose, mode, radius, x, y);
}

function knowledgeOfCell(
  pose: AgentPose,
  mode: AgentMode,
  sightRadiusTiles: number,
  sight: SightWindow,
  remembers: boolean,
  x: number,
  y: number,
): CellKnowledge {
  if (x === pose.x && y === pose.y) return 'sight';
  if (agentCanSee(mode, pose, sightRadiusTiles, x, y) && sight.inSight(x, y)) return 'sight';
  return remembers && sight.remembered(x, y) ? 'memory' : 'hidden';
}

const TALLEST_ELEVATION_DIGIT = 35;

interface ElevationGrid {
  rows: string[];
  floorSteps: number;
}

function elevationGrid(stepsSeen: (number | null)[][]): ElevationGrid | null {
  const seen = stepsSeen.flat().filter((steps): steps is number => steps !== null);
  const floorSteps = Math.min(...seen);
  if (seen.length === 0 || Math.max(...seen) === floorSteps) return null;
  return {
    rows: stepsSeen.map((row) =>
      row.map((steps) => (steps === null ? BLANK_GLYPH : digitAbove(floorSteps, steps))).join(''),
    ),
    floorSteps,
  };
}

function digitAbove(floorSteps: number, steps: number): string {
  return Math.min(TALLEST_ELEVATION_DIGIT, steps - floorSteps).toString(36);
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
  return collectGlyph(legend, observed.glyph, observed.meaning, observed.walkable);
}

function collectGlyph(
  legend: Map<string, LegendEntry>,
  glyph: string,
  meaning: string,
  walkable: boolean | null,
): string {
  if (theWholeGridSharesOneLegendEntryFor(glyph)) return glyph;
  return collectLegend(legend, glyph, meaning, walkable);
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
    meaning: blankMeaningFor(mode, sightRadiusTiles),
    walkable: null,
  });
}

function blankMeaningFor(mode: AgentMode, sightRadiusTiles: number): string {
  if (seesTheWholeWindow(mode)) return 'nothing generated here';
  return `nothing generated here, or unseen: ${whyItIsUnseen(mode, sightRadiusTiles)}`;
}
