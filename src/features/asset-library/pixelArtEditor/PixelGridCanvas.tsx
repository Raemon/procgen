import { useEffect, useRef, type CanvasHTMLAttributes } from 'react';
import { paintFacePixels } from '@/features/game/render/paintFacePixels';
import { faceGridSize, type FacePixels } from '../tiles/tileFaceArt';

export const PixelGridCanvas = ({
  pixels,
  unpainted = null,
  ...canvasProps
}: { pixels: FacePixels; unpainted?: string | null } & CanvasHTMLAttributes<HTMLCanvasElement>) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    canvas.current.width = canvas.current.height = faceGridSize(pixels);
    paintFacePixels(canvas.current.getContext('2d')!, pixels, unpainted, 1);
  }, [pixels, unpainted]);
  return <canvas ref={canvas} {...canvasProps} />;
};
