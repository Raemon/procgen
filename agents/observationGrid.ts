import type { AgentMode, AgentPose } from './agentMode';
import { viewportCenteredOn, type AsciiViewport } from '../world/render/ascii/asciiViewport';
import { clampSightRadiusTiles, isWithinSightRadius } from '../world/vision/characterSight';
import {
  headingUpGridColumns,
  headingUpGridRows,
  tilesAheadOfGridRow,
  tilesRightOfGridColumn,
  worldOffsetAheadAndRight,
} from '../world/vision/headingUpGrid';

export const GOD_VIEW_SIZE = 33;

export interface ObservationGridCell {
  x: number;
  y: number;
}

export interface ObservationGrid {
  columns: number;
  rows: number;
  worldCellAt(column: number, row: number): ObservationGridCell;
}

export function observationGrid(
  mode: AgentMode,
  pose: AgentPose,
  sightRadiusTiles: number,
): ObservationGrid {
  return mode === 'god'
    ? northUpWindowGrid(pose)
    : headingUpSemicircleGrid(pose, clampSightRadiusTiles(sightRadiusTiles));
}

export function gridCellIsOnTheGrid(grid: ObservationGrid, column: number, row: number): boolean {
  return column >= 0 && column < grid.columns && row >= 0 && row < grid.rows;
}

export function worldTilesTheGridReachesInto(
  mode: AgentMode,
  pose: AgentPose,
  sightRadiusTiles: number,
): AsciiViewport {
  const span =
    mode === 'god'
      ? GOD_VIEW_SIZE
      : headingUpGridColumns(clampSightRadiusTiles(sightRadiusTiles));
  return viewportCenteredOn(pose.x, pose.y, span, span);
}

export function worldCellIsWithinTheGridHandedToTheAgent(
  mode: AgentMode,
  pose: AgentPose,
  sightRadiusTiles: number,
  cell: ObservationGridCell,
): boolean {
  const dx = cell.x - pose.x;
  const dy = cell.y - pose.y;
  if (mode === 'god') {
    const half = Math.floor(GOD_VIEW_SIZE / 2);
    return Math.abs(dx) <= half && Math.abs(dy) <= half;
  }
  return isWithinSightRadius(dx, dy, clampSightRadiusTiles(sightRadiusTiles));
}

export function gridHandedToTheAgentPhrase(mode: AgentMode, sightRadiusTiles: number): string {
  if (mode === 'god') return `${GOD_VIEW_SIZE}x${GOD_VIEW_SIZE} grid`;
  return `${clampSightRadiusTiles(sightRadiusTiles)}-tile half-disc`;
}

function northUpWindowGrid(pose: AgentPose): ObservationGrid {
  const viewport = viewportCenteredOn(pose.x, pose.y, GOD_VIEW_SIZE, GOD_VIEW_SIZE);
  return {
    columns: GOD_VIEW_SIZE,
    rows: GOD_VIEW_SIZE,
    worldCellAt: (column, row) => ({
      x: viewport.originX + column,
      y: viewport.originY + row,
    }),
  };
}

function headingUpSemicircleGrid(pose: AgentPose, radius: number): ObservationGrid {
  return {
    columns: headingUpGridColumns(radius),
    rows: headingUpGridRows(radius),
    worldCellAt: (column, row) => {
      const offset = worldOffsetAheadAndRight(
        pose.facing,
        tilesAheadOfGridRow(radius, row),
        tilesRightOfGridColumn(radius, column),
      );
      return { x: pose.x + offset.dx, y: pose.y + offset.dy };
    },
  };
}
