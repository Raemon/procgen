import { useEffect, useRef } from 'react';
import type { Piece } from '../pieceDef';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { ORBIT_TIP } from './help/pieceTips';
import { PiecePreviewScene } from './piecePreviewScene';

export function PiecePreview3D({ piece, tileAssets }: { piece: Piece; tileAssets: ReadOnlyTileAssets }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<PiecePreviewScene | null>(null);

  useEffect(() => {
    scene.current = new PiecePreviewScene(canvas.current!);
    return () => {
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => scene.current?.showPiece(piece, tileAssets));

  return (
    <canvas
      ref={canvas}
      {...tooltipHandlers(ORBIT_TIP)}
      className="mt-1.5 block h-32 w-full cursor-grab touch-none rounded-[3px] border border-art-edge"
    />
  );
}
