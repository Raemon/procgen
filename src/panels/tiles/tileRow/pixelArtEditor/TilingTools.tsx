import { useEffect, useRef } from 'react';
import { paintFacePixels } from '../../../../world/tiles/paintFacePixels';
import { faceGridSize, type FacePixels } from '../../../../world/tiles/tileFaceArt';
import { Button } from '../../../../ui/controls/Button';

const TILED_REPEATS = 3;
const SHIFTS: { label: string; dx: number; dy: number }[] = [
  { label: '←', dx: -1, dy: 0 },
  { label: '→', dx: 1, dy: 0 },
  { label: '↑', dx: 0, dy: -1 },
  { label: '↓', dx: 0, dy: 1 },
];

export function TilingTools({
  pixels,
  baseColor,
  onShift,
}: {
  pixels: FacePixels;
  baseColor: string;
  onShift(dx: number, dy: number): void;
}) {
  return (
    <div className="flex flex-1 items-center gap-1">
      {SHIFTS.map((shift) => (
        <Button
          key={shift.label}
          className="px-1.5 py-0.5 text-[11px]"
          title="shift this face one pixel (wraps around, for seamless tiling)"
          onClick={() => onShift(shift.dx, shift.dy)}
        >
          {shift.label}
        </Button>
      ))}
      <TiledPreview pixels={pixels} baseColor={baseColor} />
    </div>
  );
}

function TiledPreview({ pixels, baseColor }: { pixels: FacePixels; baseColor: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawTiled(canvas.current, pixels, baseColor);
  }, [pixels, baseColor]);
  return (
    <canvas
      ref={canvas}
      title="this face repeated 3×3: seams show up here"
      className="ml-auto h-[54px] w-[54px] rounded-[3px] border border-art-edge [image-rendering:pixelated]"
    />
  );
}

function drawTiled(canvas: HTMLCanvasElement, pixels: FacePixels, baseColor: string): void {
  const size = faceGridSize(pixels);
  canvas.width = canvas.height = size * TILED_REPEATS;
  const ctx = canvas.getContext('2d')!;
  for (let tileY = 0; tileY < TILED_REPEATS; tileY++)
    for (let tileX = 0; tileX < TILED_REPEATS; tileX++)
      drawTileAt(ctx, pixels, baseColor, tileX * size, tileY * size);
}

function drawTileAt(
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
