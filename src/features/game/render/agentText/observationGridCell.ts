import type { AgentObservation } from '../../../agents/observation';
import type { HoveredCell } from '../../hover/hoveredTile';
import { viewportCenteredOn } from '../ascii/asciiViewport';
import type { TextGridCell } from './textGridCellUnderPointer';

export function worldCellOfObservationGridCell(
  obs: AgentObservation,
  cell: TextGridCell,
): HoveredCell | null {
  if (!isInsideTheGrid(obs, cell.column, cell.row)) return null;
  const viewport = viewportCenteredOn(obs.position.x, obs.position.y, obs.viewSize, obs.viewSize);
  return { x: viewport.originX + cell.column, y: viewport.originY + cell.row };
}

function isInsideTheGrid(obs: AgentObservation, column: number, row: number): boolean {
  return column >= 0 && column < obs.viewSize && row >= 0 && row < obs.viewSize;
}
