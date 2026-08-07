import { useEffect, useRef, type PointerEvent } from 'react';
import { paintFacePixels } from '../../views/paintFacePixels';
import { faceGridSize, type FacePixels } from '../../world/tiles/tileFaceArt';

const CANVAS_TARGET_PIXELS = 256;
const SMALLEST_LEGIBLE_GRID_SCALE = 4;

const CHECKER_SQUARES =
  'linear-gradient(45deg, #2b2b2b 25%, transparent 25%, transparent 75%, #2b2b2b 75%)';

const TRANSPARENCY_CHECKER = {
  backgroundImage: `${CHECKER_SQUARES}, ${CHECKER_SQUARES}`,
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 6px 6px',
  backgroundColor: '#1e1e1e',
};

export type StrokePhase = 'start' | 'drag';

export function PixelPaintCanvas({
  pixels,
  baseColor,
  onPaintPixel,
  onStrokeEnd,
}: {
  pixels: FacePixels;
  baseColor: string;
  onPaintPixel(index: number, phase: StrokePhase): void;
  onStrokeEnd(): void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stroking = useRef(false);
  const gridSize = faceGridSize(pixels);

  useEffect(() => {
    if (canvas.current) redraw(canvas.current, pixels, baseColor, gridSize);
  }, [pixels, baseColor, gridSize]);

  function beginStroke(event: PointerEvent<HTMLCanvasElement>): void {
    stroking.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onPaintPixel(pixelIndexAt(event, gridSize), 'start');
  }

  function continueStroke(event: PointerEvent<HTMLCanvasElement>): void {
    if (stroking.current) onPaintPixel(pixelIndexAt(event, gridSize), 'drag');
  }

  function finishStroke(): void {
    if (!stroking.current) return;
    stroking.current = false;
    onStrokeEnd();
  }

  return (
    <canvas
      ref={canvas}
      className="block w-full cursor-crosshair touch-none rounded-[3px] border border-art-edge [image-rendering:pixelated]"
      style={TRANSPARENCY_CHECKER}
      onPointerDown={beginStroke}
      onPointerMove={continueStroke}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
    />
  );
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
  if (scale >= SMALLEST_LEGIBLE_GRID_SCALE) drawGridLines(ctx, gridSize, scale);
}

function fitCanvasToGrid(canvas: HTMLCanvasElement, gridSize: number): number {
  const scale = Math.max(1, Math.floor(CANVAS_TARGET_PIXELS / gridSize));
  const edge = gridSize * scale;
  if (canvas.width !== edge) canvas.width = canvas.height = edge;
  return scale;
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

function pixelIndexAt(event: PointerEvent<HTMLCanvasElement>, size: number): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const column = gridCoord((event.clientX - rect.left) / rect.width, size);
  const row = gridCoord((event.clientY - rect.top) / rect.height, size);
  return row * size + column;
}

function gridCoord(fraction: number, size: number): number {
  return Math.min(size - 1, Math.max(0, Math.floor(fraction * size)));
}
