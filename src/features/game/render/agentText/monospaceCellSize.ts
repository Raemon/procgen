export interface MonospaceCellSize {
  width: number;
  height: number;
}

export function monospaceCellSize(text: HTMLElement): MonospaceCellSize | null {
  const cell = text.firstElementChild;
  if (cell instanceof HTMLElement) {
    const box = cell.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return { width: box.width, height: box.height };
  }
  const size = parseFloat(getComputedStyle(text).fontSize);
  return size > 0 ? { width: size, height: size } : null;
}
