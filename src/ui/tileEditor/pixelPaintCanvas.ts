import { FACE_ART_SIZE, type FacePixels } from '../../world/tiles/tileFaceArt';
import { paintFacePixels } from '../../views/paintFacePixels';

const PIXEL_SCALE = 16;

export type PixelPaintCanvasCallbacks = {
  onPaintPixel(index: number): void;
  onStrokeEnd(): void;
};

export interface PixelPaintCanvas {
  canvas: HTMLCanvasElement;
  redraw(pixels: FacePixels, baseColor: string): void;
}

export function pixelPaintCanvas(callbacks: PixelPaintCanvasCallbacks): PixelPaintCanvas {
  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-canvas';
  canvas.width = canvas.height = FACE_ART_SIZE * PIXEL_SCALE;
  const ctx = canvas.getContext('2d')!;
  wireStrokePainting(canvas, callbacks);
  return { canvas, redraw: (pixels, baseColor) => redraw(ctx, pixels, baseColor) };
}

function redraw(ctx: CanvasRenderingContext2D, pixels: FacePixels, baseColor: string): void {
  paintFacePixels(ctx, pixels, baseColor, PIXEL_SCALE);
  drawGridLines(ctx);
}

function wireStrokePainting(
  canvas: HTMLCanvasElement,
  { onPaintPixel, onStrokeEnd }: PixelPaintCanvasCallbacks,
): void {
  let stroking = false;
  canvas.addEventListener('pointerdown', (event) => {
    stroking = true;
    canvas.setPointerCapture(event.pointerId);
    onPaintPixel(pixelIndexAt(canvas, event));
  });
  canvas.addEventListener('pointermove', (event) => {
    if (stroking) onPaintPixel(pixelIndexAt(canvas, event));
  });
  canvas.addEventListener('pointerup', () => {
    if (!stroking) return;
    stroking = false;
    onStrokeEnd();
  });
}

function pixelIndexAt(canvas: HTMLCanvasElement, event: PointerEvent): number {
  const rect = canvas.getBoundingClientRect();
  const col = gridCoord((event.clientX - rect.left) / rect.width);
  const row = gridCoord((event.clientY - rect.top) / rect.height);
  return row * FACE_ART_SIZE + col;
}

function gridCoord(fraction: number): number {
  return Math.min(FACE_ART_SIZE - 1, Math.max(0, Math.floor(fraction * FACE_ART_SIZE)));
}

function drawGridLines(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let line = 1; line < FACE_ART_SIZE; line++) {
    const offset = line * PIXEL_SCALE + 0.5;
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, FACE_ART_SIZE * PIXEL_SCALE);
    ctx.moveTo(0, offset);
    ctx.lineTo(FACE_ART_SIZE * PIXEL_SCALE, offset);
  }
  ctx.stroke();
}
