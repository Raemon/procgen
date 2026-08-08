import { walkabilityPhrase } from '../../agents/observationText';
import { interactPrompt } from '../puzzles/interaction/actionWithinReach';
import type { HoveredTileReport } from './hoveredTileReport';

export function hoveredTileLines(report: HoveredTileReport): string[] {
  return [
    `(${report.cell.x},${report.cell.y}) '${report.observed.glyph}' ${report.observed.meaning}`,
    ...linesOf(walkabilityPhrase(report.observed.walkable)),
    ...linesOf(interactPrompt(report.action)),
  ];
}

function linesOf(line: string | null): string[] {
  return line === null ? [] : [line];
}
