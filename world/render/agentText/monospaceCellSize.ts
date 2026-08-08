const PROBE_TEXT = 'M'.repeat(64);
const FALLBACK_LINE_HEIGHT_RATIO = 1.2;

export interface MonospaceCellSize {
  width: number;
  height: number;
}

export function monospaceCellSize(text: HTMLElement): MonospaceCellSize | null {
  const width = characterWidthOf(text);
  const height = lineHeightOf(text);
  return width > 0 && height > 0 ? { width, height } : null;
}

function characterWidthOf(text: HTMLElement): number {
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.whiteSpace = 'pre';
  probe.textContent = PROBE_TEXT;
  text.appendChild(probe);
  const width = probe.getBoundingClientRect().width / PROBE_TEXT.length;
  probe.remove();
  return width;
}

function lineHeightOf(text: HTMLElement): number {
  const style = getComputedStyle(text);
  const lineHeight = parseFloat(style.lineHeight);
  if (Number.isFinite(lineHeight)) return lineHeight;
  return parseFloat(style.fontSize) * FALLBACK_LINE_HEIGHT_RATIO;
}
