import { useEffect, useRef, type PointerEvent } from 'react';
import { EMPTY_VOXEL, voxelAt, type Prefab } from '../prefabDef';
import type { ReadOnlyTileset } from '../../../frontend/readOnlyLibraries';

const TARGET_CANVAS_PIXELS = 200;
const EMPTY_INK = '#141b28';
const GRID_INK = 'rgba(255, 255, 255, 0.08)';
const ANCHOR_INK = 'rgba(255, 216, 106, 0.8)';

export function VoxelLayerCanvas({
  prefab,
  layer,
  tileset,
  onPaintCell,
}: {
  prefab: Prefab;
  layer: number;
  tileset: ReadOnlyTileset;
  onPaintCell(x: number, y: number): void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);

  useEffect(() => {
    if (canvas.current) redraw(canvas.current, prefab, layer, tileset);
  });

  function paintAt(event: PointerEvent<HTMLCanvasElement>): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = cellCoord((event.clientX - rect.left) / rect.width, prefab.width);
    const y = cellCoord((event.clientY - rect.top) / rect.height, prefab.depth);
    onPaintCell(x, y);
  }

  return (
    <canvas
      ref={canvas}
      className="mt-1.5 block w-full cursor-crosshair touch-none rounded-[3px] border border-art-edge [image-rendering:pixelated]"
      onPointerDown={(event) => {
        painting.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        paintAt(event);
      }}
      onPointerMove={(event) => painting.current && paintAt(event)}
      onPointerUp={() => (painting.current = false)}
      onPointerCancel={() => (painting.current = false)}
    />
  );
}

function redraw(
  canvas: HTMLCanvasElement,
  prefab: Prefab,
  layer: number,
  tileset: ReadOnlyTileset,
): void {
  const scale = fitCanvasToFootprint(canvas, prefab);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = EMPTY_INK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  paintLayer(ctx, prefab, layer - 1, tileset, scale, 0.28);
  paintLayer(ctx, prefab, layer, tileset, scale, 1);
  paintGrid(ctx, prefab, scale);
  paintAnchor(ctx, prefab, scale);
}

function fitCanvasToFootprint(canvas: HTMLCanvasElement, prefab: Prefab): number {
  const scale = Math.max(4, Math.floor(TARGET_CANVAS_PIXELS / Math.max(prefab.width, prefab.depth)));
  canvas.width = prefab.width * scale;
  canvas.height = prefab.depth * scale;
  return scale;
}

function paintLayer(
  ctx: CanvasRenderingContext2D,
  prefab: Prefab,
  layer: number,
  tileset: ReadOnlyTileset,
  scale: number,
  alpha: number,
): void {
  if (layer < 0) return;
  ctx.globalAlpha = alpha;
  for (let y = 0; y < prefab.depth; y++) {
    for (let x = 0; x < prefab.width; x++) {
      const tileId = voxelAt(prefab, x, y, layer);
      if (tileId === EMPTY_VOXEL) continue;
      ctx.fillStyle = tileset.byId(tileId)?.color ?? '#888888';
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  ctx.globalAlpha = 1;
}

function paintGrid(ctx: CanvasRenderingContext2D, prefab: Prefab, scale: number): void {
  ctx.strokeStyle = GRID_INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < prefab.width; x++) {
    ctx.moveTo(x * scale + 0.5, 0);
    ctx.lineTo(x * scale + 0.5, prefab.depth * scale);
  }
  for (let y = 1; y < prefab.depth; y++) {
    ctx.moveTo(0, y * scale + 0.5);
    ctx.lineTo(prefab.width * scale, y * scale + 0.5);
  }
  ctx.stroke();
}

function paintAnchor(ctx: CanvasRenderingContext2D, prefab: Prefab, scale: number): void {
  ctx.strokeStyle = ANCHOR_INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(prefab.anchorX * scale + 1, prefab.anchorY * scale + 1, scale - 2, scale - 2);
}

function cellCoord(fraction: number, size: number): number {
  return Math.min(size - 1, Math.max(0, Math.floor(fraction * size)));
}
