import { windowValueAt, type FieldWindow } from './fieldWindow';

export interface FieldGradient {
  acrossX: number;
  acrossY: number;
}

export function gradientAcross(
  window: FieldWindow,
  cellX: number,
  cellY: number,
  radiusCells: number,
): FieldGradient {
  return {
    acrossX:
      windowValueAt(window, cellX + radiusCells, cellY) - windowValueAt(window, cellX - radiusCells, cellY),
    acrossY:
      windowValueAt(window, cellX, cellY + radiusCells) - windowValueAt(window, cellX, cellY - radiusCells),
  };
}
