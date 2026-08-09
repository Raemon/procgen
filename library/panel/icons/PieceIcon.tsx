import { useEffect, useRef } from 'react';
import type { Piece } from '../../../assets/pieces/pieceDef';
import { pieceTopColors, type ColorOfTile } from '../../../assets/pieces/pieceTopColors';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { AssetIconFrame } from './AssetIconFrame';

export function PieceIcon({ piece }: { piece: Piece }) {
  const { tileAssets } = useAppRuntime();
  const colorOfTile: ColorOfTile = (tileId) => tileAssets.byId(tileId)?.color ?? null;
  return (
    <AssetIconFrame>
      <PieceFromAboveCanvas piece={piece} colors={pieceTopColors(piece, colorOfTile)} />
    </AssetIconFrame>
  );
}

function PieceFromAboveCanvas({ piece, colors }: { piece: Piece; colors: (string | null)[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) paintFromAbove(canvas.current, piece.width, colors);
  }, [piece.width, colors]);
  return <canvas ref={canvas} className="block h-full w-full [image-rendering:pixelated]" />;
}

function paintFromAbove(canvas: HTMLCanvasElement, width: number, colors: (string | null)[]): void {
  const depth = Math.ceil(colors.length / width);
  canvas.width = width;
  canvas.height = depth;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, depth);
  colors.forEach((color, index) => {
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(index % width, Math.floor(index / width), 1, 1);
  });
}
