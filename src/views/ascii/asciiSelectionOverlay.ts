import type { WorldRegion } from '../../prefabs/captureRegionAsPrefab';
import type { AsciiPixelViewport } from './asciiViewport';

const SELECTION_INK = '#ffd86a';
const SELECTION_FILL = 'rgba(255, 216, 106, 0.12)';

export function paintSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  viewport: AsciiPixelViewport,
  region: WorldRegion,
): void {
  const left = viewport.subCellOffsetX + (region.minX - viewport.originX) * viewport.cellPx;
  const top = viewport.subCellOffsetY + (region.minY - viewport.originY) * viewport.cellPx;
  const width = (region.maxX - region.minX + 1) * viewport.cellPx;
  const height = (region.maxY - region.minY + 1) * viewport.cellPx;
  ctx.fillStyle = SELECTION_FILL;
  ctx.fillRect(left, top, width, height);
  ctx.strokeStyle = SELECTION_INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
}
