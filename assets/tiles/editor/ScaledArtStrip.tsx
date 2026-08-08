import { useEffect, useRef } from 'react';
import { paintFacePixels } from '../../../world/render/paintFacePixels';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import { faceArtMips, type FaceMip } from '../mips/faceArtMips';
import type { FacePixels } from '../tileFaceArt';
import { scaledArtTip, SCALED_ART_STRIP_TIP } from './help/tileTips';

const SWATCH_PIXELS = 28;

export function ScaledArtStrip({
  pixels,
  unpainted,
}: {
  pixels: FacePixels;
  unpainted: string | null;
}) {
  const mips = faceArtMips(pixels, unpainted);
  return (
    <div className="mt-1 flex items-end gap-1" {...tooltipHandlers(SCALED_ART_STRIP_TIP)}>
      {mips.map((mip) => (
        <MipSwatch key={mip.side} mip={mip} />
      ))}
    </div>
  );
}

function MipSwatch({ mip }: { mip: FaceMip }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawMip(canvas.current, mip);
  }, [mip]);
  return (
    <canvas
      ref={canvas}
      className="block rounded-[2px] [image-rendering:pixelated]"
      style={{ width: SWATCH_PIXELS, height: SWATCH_PIXELS }}
      {...tooltipHandlers(scaledArtTip(mip.side))}
    />
  );
}

function drawMip(canvas: HTMLCanvasElement, mip: FaceMip): void {
  canvas.width = canvas.height = mip.side;
  paintFacePixels(canvas.getContext('2d')!, mip.inks, null, 1);
}
