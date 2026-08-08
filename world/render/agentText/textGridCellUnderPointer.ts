import type { MonospaceCellSize } from './monospaceCellSize';

export interface TextGridCell {
  column: number;
  row: number;
}

export function textGridCellUnderPointer(
  text: HTMLElement,
  cellSize: MonospaceCellSize,
  offsetX: number,
  offsetY: number,
): TextGridCell {
  const style = getComputedStyle(text);
  return {
    column: Math.floor((offsetX + text.scrollLeft - parseFloat(style.paddingLeft)) / cellSize.width),
    row: Math.floor((offsetY + text.scrollTop - parseFloat(style.paddingTop)) / cellSize.height),
  };
}
