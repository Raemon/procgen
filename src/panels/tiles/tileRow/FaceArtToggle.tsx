import { useEffect, useRef } from 'react';
import { paintFacePixels } from '../../../world/tiles/paintFacePixels';
import type { TileDef } from '../../../world/tiles/tileDef';
import { blankFacePixels, faceGridSize } from '../../../world/tiles/tileFaceArt';
import { Button } from '../../../ui/controls/Button';

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
    <Button
      className="h-6 w-7 shrink-0 p-0.5"
      title="pixel art (per cube face)"
      active={open}
      onClick={onToggle}
    >
      <TopFacePreview tile={tile} />
    </Button>
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
