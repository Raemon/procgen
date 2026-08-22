import type { TileId } from '@/features/asset-library/asset';
import { useEffect, useRef, useState } from 'react';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { AssetIconFrame } from './AssetIconFrame';
import { renderPieceThumbnail } from './renderPieceThumbnail';

const thumbnailCache = new Map<string, string>();
const MAX_CACHED_THUMBNAILS = 512;

export function PieceIcon({ piece }: { piece: Piece }) {
  const { tileAssets } = useAppRuntime();
  const renderKey = pieceThumbnailKey(piece, (tileId) => tileAssets.byId(tileId)?.color ?? null);
  return (
    <AssetIconFrame>
      <PieceThumbnail piece={piece} renderKey={renderKey} />
    </AssetIconFrame>
  );
}

function PieceThumbnail({ piece, renderKey }: { piece: Piece; renderKey: string }) {
  const { tileAssets } = useAppRuntime();
  const observed = useRef<HTMLImageElement>(null);
  const [rendered, setRendered] = useState<{ key: string; src: string } | null>(null);
  const cached = thumbnailCache.get(renderKey);
  const thumbnail = cached ?? (rendered?.key === renderKey ? rendered.src : null);

  useEffect(() => {
    if (thumbnailCache.has(renderKey)) return;
    const image = observed.current;
    if (!image) return;
    const render = (): void => {
      const alreadyRendered = thumbnailCache.get(renderKey);
      const src = alreadyRendered ?? renderPieceThumbnail(piece, tileAssets);
      if (!src) return;
      keepThumbnail(renderKey, src);
      setRendered({ key: renderKey, src });
    };
    if (typeof IntersectionObserver === 'undefined') {
      render();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      render();
    });
    observer.observe(image);
    return () => observer.disconnect();
  }, [piece, renderKey, tileAssets]);

  return <img ref={observed} src={thumbnail ?? undefined} alt="" className="block h-full w-full" />;
}

export function pieceThumbnailKey(
  piece: Piece,
  colorOfTile: (tileId: TileId) => string | null,
): string {
  const tileColors = [...new Set(piece.voxels)]
    .sort((left, right) => left - right)
    .map((tileId) => `${tileId}:${colorOfTile(tileId) ?? ''}`)
    .join('|');
  return `${piece.width}x${piece.depth}x${piece.layers}:${piece.voxels.join(',')}:${tileColors}`;
}

function keepThumbnail(key: string, thumbnail: string): void {
  thumbnailCache.set(key, thumbnail);
  if (thumbnailCache.size <= MAX_CACHED_THUMBNAILS) return;
  const oldestKey = thumbnailCache.keys().next().value;
  if (oldestKey) thumbnailCache.delete(oldestKey);
}
