import type { AgentMode, AgentPose } from '../../agents/agentMode';
import { viewSizeFor, type ObservedOverlay } from '../../agents/observation';
import {
  BLANK_GLYPH,
  agentCanSee,
  observedTileAt,
  unseenTile,
  type ObservedTile,
} from '../../agents/observedTile';
import { terrainHidesTileFrom } from '../../agents/terrainSightline';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { pointOverlayLookup } from '../render/ascii/asciiCells';
import { clampSightRadiusTiles } from '../vision/characterSight';
import type { HoveredCell } from './hoveredTile';

export interface AgentEyes {
  sampler: WorldSampler;
  tileAssets: ReadOnlyTileAssets;
  overlay: ObservedOverlay;
  pose: AgentPose;
  mode: AgentMode;
  sightRadiusTiles: number;
}

export interface HoveredTileReport {
  cell: HoveredCell;
  observed: ObservedTile;
  action: string | null;
}

export function hoveredTileReport(eyes: AgentEyes, cell: HoveredCell): HoveredTileReport {
  const radius = clampSightRadiusTiles(eyes.sightRadiusTiles);
  const size = viewSizeFor(eyes.mode, radius);
  if (!fallsInsideTheAgentsGrid(eyes.pose, size, cell)) {
    return { cell, observed: beyondTheGrid(size), action: null };
  }
  const hiddenByTerrain = terrainHidesTileFrom(
    eyes.sampler,
    eyes.tileAssets,
    eyes.pose,
    eyes.mode,
    cell.x,
    cell.y,
  );
  return {
    cell,
    observed: hiddenByTerrain
      ? unseenTile(radius)
      : observedTileAt(
          eyes.sampler,
          eyes.tileAssets,
          markersOnJustThisCell(eyes, cell),
          eyes.pose,
          eyes.mode,
          radius,
          cell.x,
          cell.y,
        ),
    action: !hiddenByTerrain && agentCanSee(eyes.mode, eyes.pose, radius, cell.x, cell.y)
      ? eyes.overlay.actionAt(cell.x, cell.y)
      : null,
  };
}

function fallsInsideTheAgentsGrid(pose: AgentPose, size: number, cell: HoveredCell): boolean {
  const half = Math.floor(size / 2);
  return Math.abs(cell.x - pose.x) <= half && Math.abs(cell.y - pose.y) <= half;
}

function beyondTheGrid(size: number): ObservedTile {
  return {
    glyph: BLANK_GLYPH,
    meaning: `outside the ${size}x${size} grid an agent is handed`,
    walkable: null,
  };
}

function markersOnJustThisCell(eyes: AgentEyes, cell: HoveredCell) {
  return pointOverlayLookup(
    eyes.sampler,
    { originX: cell.x, originY: cell.y, columns: 1, rows: 1 },
    eyes.overlay,
  );
}
