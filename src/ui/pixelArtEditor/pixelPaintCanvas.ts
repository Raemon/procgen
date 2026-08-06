import {
  DEFAULT_FACE_ART_SIZE,
  faceGridSize,
  type FacePixels,
} from '../../world/tiles/tileFaceArt';
import { paintFacePixels } from '../../views/paintFacePixels';

const CANVAS_TARGET_PIXELS = 160;

export type StrokePhase = 'start' | 'drag';

export type PixelPaintCanvasCallbacks = {
  onPaintPixel(index: number, phase: StrokePhase): void;
  onStrokeEnd(): void;
};

export interface PixelPaintCanvas {
  canvas: HTMLCanvasElement;
  redraw(pixels: FacePixels, baseColor: string): void;
}

export function pixelPaintCanvas(callbacks: PixelPaintCanvasCallbacks): PixelPaintCanvas {
  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-canvas';
  let gridSize = DEFAULT_FACE_ART_SIZE;
  wireStrokePainting(canvas, callbacks, () => gridSize);
  return {
    canvas,
    redraw(pixels, baseColor) {
      gridSize = faceGridSize(pixels);
      redraw(canvas, pixels, baseColor, gridSize);
    },
  };
}

function redraw(
  canvas: HTMLCanvasElement,
  pixels: FacePixels,
  baseColor: string,
  gridSize: number,
): void {
  const scale = fitCanvasToGrid(canvas, gridSize);
  const ctx = canvas.getContext('2d')!;
  paintFacePixels(ctx, pixels, baseColor, scale);
  drawGridLines(ctx, gridSize, scale);
}

function fitCanvasToGrid(canvas: HTMLCanvasElement, gridSize: number): number {
  const scale = Math.max(1, Math.floor(CANVAS_TARGET_PIXELS / gridSize));
  const edge = gridSize * scale;
  if (canvas.width !== edge) canvas.width = canvas.height = edge;
  return scale;
}

function wireStrokePainting(
  canvas: HTMLCanvasElement,
  { onPaintPixel, onStrokeEnd }: PixelPaintCanvasCallbacks,
  gridSize: () => number,
): void {
  let stroking = false;
  canvas.addEventListener('pointerdown', (event) => {
    stroking = true;
    canvas.setPointerCapture(event.pointerId);
    onPaintPixel(pixelIndexAt(canvas, event, gridSize()), 'start');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (stroking) onPaintPixel(pixelIndexAt(canvas, event, gridSize()), 'drag');
  });
  canvas.addEventListener('pointerup', () => {
    if (!stroking) return;
    stroking = false;
    onStrokeEnd();
  });
}

function pixelIndexAt(canvas: HTMLCanvasElement, event: PointerEvent, size: number): number {
  const rect = canvas.getBoundingClientRect();
  const col = gridCoord((event.clientX - rect.left) / rect.width, size);
  const row = gridCoord((event.clientY - rect.top) / rect.height, size);
  return row * size + col;
}

function gridCoord(fraction: number, size: number): number {
  return Math.min(size - 1, Math.max(0, Math.floor(fraction * size)));
}

function drawGridLines(ctx: CanvasRenderingContext2D, gridSize: number, scale: number): void {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let line = 1; line < gridSize; line++) {
    const offset = line * scale + 0.5;
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, gridSize * scale);
    ctx.moveTo(0, offset);
    ctx.lineTo(gridSize * scale, offset);
  }
  ctx.stroke();
}
