import { facingVector, type FacingIndex } from '../../facing';

export const INTERACT_KEY = 'F';

export interface ActionOfferingCells {
  actionAt(x: number, y: number): string | null;
}

export interface Reacher {
  x: number;
  y: number;
  facing: FacingIndex;
}

export function actionWithinReach(cells: ActionOfferingCells, reacher: Reacher): string | null {
  const underfoot = cells.actionAt(reacher.x, reacher.y);
  if (underfoot) return underfoot;
  const ahead = facingVector(reacher.facing);
  return cells.actionAt(reacher.x + ahead.dx, reacher.y + ahead.dy);
}

export function interactPrompt(action: string | null): string | null {
  return action === null ? null : `press [${INTERACT_KEY}] to ${action}`;
}
