import { useEffect, useRef, type PointerEvent } from 'react';
import { EMPTY_VOXEL, facingAt, voxelAt, type Piece } from '../pieceDef';
import { FACING_GLYPHS } from './facingGlyphs';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';

const TARGET_CANVAS_PIXELS = 200;
const EMPTY_INK = '#141b28';
const GRID_INK = 'rgba(255, 255, 255, 0.08)';
const ANCHOR_INK = 'rgba(255, 216, 106, 0.8)';
const FACING_INK = 'rgba(10, 14, 22, 0.75)';

export function VoxelLayerCanvas({
  piece,
  layer,
  tileAssets,
  onPaintCell,
}: {
  piece: Piece;
  layer: number;
  tileAssets: ReadOnlyTileAssets;
  onPaintCell(x: number, y: number): void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const painting = useRef(false);

  useEffect(() => {
    if (canvas.current) redraw(canvas.current, piece, layer, tileAssets);
  });

  function paintAt(event: PointerEvent<HTMLCanvasElement>): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = cellCoord((event.clientX - rect.left) / rect.width, piece.width);
    const y = cellCoord((event.clientY - rect.top) / rect.height, piece.depth);
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
  piece: Piece,
  layer: number,
  tileAssets: ReadOnlyTileAssets,
): void {
  const scale = fitCanvasToFootprint(canvas, piece);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = EMPTY_INK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  paintLayer(ctx, piece, layer - 1, tileAssets, scale, 0.28);
  paintLayer(ctx, piece, layer, tileAssets, scale, 1);
  paintFacings(ctx, piece, layer, scale);
  paintGrid(ctx, piece, scale);
  paintAnchor(ctx, piece, scale);
}

function fitCanvasToFootprint(canvas: HTMLCanvasElement, piece: Piece): number {
  const scale = Math.max(4, Math.floor(TARGET_CANVAS_PIXELS / Math.max(piece.width, piece.depth)));
  canvas.width = piece.width * scale;
  canvas.height = piece.depth * scale;
  return scale;
}

function paintLayer(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  layer: number,
  tileAssets: ReadOnlyTileAssets,
  scale: number,
  alpha: number,
): void {
  if (layer < 0) return;
  ctx.globalAlpha = alpha;
  for (let y = 0; y < piece.depth; y++) {
    for (let x = 0; x < piece.width; x++) {
      const tileId = voxelAt(piece, x, y, layer);
      if (tileId === EMPTY_VOXEL) continue;
      ctx.fillStyle = tileAssets.byId(tileId)?.color ?? '#888888';
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  ctx.globalAlpha = 1;
}

function paintFacings(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  layer: number,
  scale: number,
): void {
  ctx.fillStyle = FACING_INK;
  ctx.font = `${Math.max(6, Math.floor(scale * 0.6))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let y = 0; y < piece.depth; y++) {
    for (let x = 0; x < piece.width; x++) {
      if (voxelAt(piece, x, y, layer) === EMPTY_VOXEL) continue;
      const glyph = FACING_GLYPHS[facingAt(piece, x, y, layer)] ?? '';
      ctx.fillText(glyph, (x + 0.5) * scale, (y + 0.5) * scale);
    }
  }
}

function paintGrid(ctx: CanvasRenderingContext2D, piece: Piece, scale: number): void {
  ctx.strokeStyle = GRID_INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < piece.width; x++) {
    ctx.moveTo(x * scale + 0.5, 0);
    ctx.lineTo(x * scale + 0.5, piece.depth * scale);
  }
  for (let y = 1; y < piece.depth; y++) {
    ctx.moveTo(0, y * scale + 0.5);
    ctx.lineTo(piece.width * scale, y * scale + 0.5);
  }
  ctx.stroke();
}

function paintAnchor(ctx: CanvasRenderingContext2D, piece: Piece, scale: number): void {
  ctx.strokeStyle = ANCHOR_INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(piece.anchorX * scale + 1, piece.anchorY * scale + 1, scale - 2, scale - 2);
}

function cellCoord(fraction: number, size: number): number {
  return Math.min(size - 1, Math.max(0, Math.floor(fraction * size)));
}
