import type { AgentObservation } from '../../../agents/observation';
import { viewFirstLineIndex } from '../../../agents/observationText';
import type { HoveredCell } from '../../hover/hoveredTile';
import { viewportCenteredOn } from '../ascii/asciiViewport';
import type { TextGridCell } from './textGridCellUnderPointer';

export function worldCellOfObservationGridCell(
  obs: AgentObservation,
  cell: TextGridCell,
): HoveredCell | null {
  const row = cell.row - viewFirstLineIndex(obs);
  if (!isInsideTheGrid(obs, cell.column, row)) return null;
  const viewport = viewportCenteredOn(obs.position.x, obs.position.y, obs.viewSize, obs.viewSize);
  return { x: viewport.originX + cell.column, y: viewport.originY + row };
}

function isInsideTheGrid(obs: AgentObservation, column: number, row: number): boolean {
  return column >= 0 && column < obs.viewSize && row >= 0 && row < obs.viewSize;
}
