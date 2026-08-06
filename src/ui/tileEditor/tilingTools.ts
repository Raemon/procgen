import { faceGridSize, type FacePixels } from '../../world/tiles/tileFaceArt';
import { paintFacePixels } from '../../views/paintFacePixels';

const TILED_REPEATS = 3;
const SHIFTS: { label: string; dx: number; dy: number }[] = [
  { label: '←', dx: -1, dy: 0 },
  { label: '→', dx: 1, dy: 0 },
  { label: '↑', dx: 0, dy: -1 },
  { label: '↓', dx: 0, dy: 1 },
];

export function tilingTools(onShift: (dx: number, dy: number) => void): {
  root: HTMLElement;
  refreshPreview(pixels: FacePixels, baseColor: string): void;
} {
  const preview = tiledPreviewCanvas();
  const root = document.createElement('div');
  root.className = 'pixel-tiling';
  root.append(...SHIFTS.map((shift) => shiftButton(shift, onShift)), preview);
  return { root, refreshPreview: (pixels, baseColor) => drawTiled(preview, pixels, baseColor) };
}

function tiledPreviewCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-tile-preview';
  canvas.title = 'this face repeated 3×3: seams show up here';
  return canvas;
}

function drawTiled(canvas: HTMLCanvasElement, pixels: FacePixels, baseColor: string): void {
  const size = faceGridSize(pixels);
  canvas.width = canvas.height = size * TILED_REPEATS;
  const ctx = canvas.getContext('2d')!;
  for (let tileY = 0; tileY < TILED_REPEATS; tileY++)
    for (let tileX = 0; tileX < TILED_REPEATS; tileX++)
      drawTile(ctx, pixels, baseColor, tileX * size, tileY * size);
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  pixels: FacePixels,
  baseColor: string,
  offsetX: number,
  offsetY: number,
): void {
  ctx.save();
  ctx.translate(offsetX, offsetY);
  paintFacePixels(ctx, pixels, baseColor, 1);
  ctx.restore();
}

function shiftButton(
  shift: (typeof SHIFTS)[number],
  onShift: (dx: number, dy: number) => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn pixel-shift';
  button.textContent = shift.label;
  button.title = 'shift this face one pixel (wraps around, for seamless tiling)';
  button.addEventListener('click', () => onShift(shift.dx, shift.dy));
  return button;
}
