import { PixelGridCanvas } from '../../pixelArtEditor/PixelGridCanvas';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
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
  return (
    <PixelGridCanvas
      pixels={mip.inks}
      className="block rounded-[2px] [image-rendering:pixelated]"
      style={{ width: SWATCH_PIXELS, height: SWATCH_PIXELS }}
      {...tooltipHandlers(scaledArtTip(mip.side))}
    />
  );
}
