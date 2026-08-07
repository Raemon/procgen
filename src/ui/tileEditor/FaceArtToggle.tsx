import { useEffect, useRef } from 'react';
import { paintFacePixels } from '../../views/paintFacePixels';
import type { TileDef } from '../../world/tiles/tileDef';
import { blankFacePixels, faceGridSize } from '../../world/tiles/tileFaceArt';
import { IconButton } from '../controls/IconButton';
import { TILE_ART_TIP } from './help/tileTips';

export function FaceArtToggle({
  tile,
  open,
  onToggle,
}: {
  tile: TileDef;
  open: boolean;
  onToggle(): void;
}) {
  return (
    <IconButton tip={TILE_ART_TIP} active={open} onClick={onToggle}>
      <TopFacePreview tile={tile} />
    </IconButton>
  );
}

function TopFacePreview({ tile }: { tile: TileDef }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawTopFace(canvas.current, tile);
  }, [tile, tile.faceArt, tile.color]);
  return <canvas ref={canvas} className="block h-full w-full rounded-[2px] [image-rendering:pixelated]" />;
}

function drawTopFace(canvas: HTMLCanvasElement, tile: TileDef): void {
  const pixels = tile.faceArt?.top ?? blankFacePixels();
  canvas.width = canvas.height = faceGridSize(pixels);
  paintFacePixels(canvas.getContext('2d')!, pixels, tile.color, 1);
}
