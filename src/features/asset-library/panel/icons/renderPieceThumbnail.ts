import * as THREE from 'three';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { Piece } from '../../pieces/pieceDef';
import { PieceRenderScene } from '../../pieces/editor/piecePreviewScene';

const THUMBNAIL_PX = 64;

interface ThumbnailRenderer {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: PieceRenderScene;
}

let sharedRenderer: ThumbnailRenderer | null = null;

export function renderPieceThumbnail(
  piece: Piece,
  tileAssets: ReadOnlyTileAssets,
): string | null {
  const thumbnailRenderer = getThumbnailRenderer();
  if (!thumbnailRenderer) return null;
  thumbnailRenderer.scene.showPiece(piece, tileAssets);
  thumbnailRenderer.scene.render(
    thumbnailRenderer.renderer,
    THUMBNAIL_PX,
    THUMBNAIL_PX,
  );
  return thumbnailRenderer.canvas.toDataURL('image/png');
}

function getThumbnailRenderer(): ThumbnailRenderer | null {
  if (sharedRenderer) return sharedRenderer;
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    sharedRenderer = { canvas, renderer, scene: new PieceRenderScene() };
    return sharedRenderer;
  } catch {
    return null;
  }
}
