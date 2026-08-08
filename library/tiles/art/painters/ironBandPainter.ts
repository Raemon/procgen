import { heightInk } from '../../faceArtHeight';
import { pixelNoise } from '../artNoise';
import { darken, lighten } from '../colorMath';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';
import {
  beveledRectPainter,
  discPainter,
  rectPainter,
  type PixelPoint,
  type PixelRect,
} from './shapePainters';

export interface IronBandStyle {
  iron: string;
  stud: string;
  studSpacing: number;
  studInset: number;
  seed: number;
}

const STUD_RADIUS = 2;
const STUD_HIGHLIGHT_RADIUS = 1.1;

export function ironBandsPainter(bands: readonly PixelRect[], style: IronBandStyle): PixelPainter {
  return stackedPainters(...bands.map((band) => ironBandPainter(band, style)));
}

export function ironBandsReliefPainter(
  bands: readonly PixelRect[],
  bandHeight: number,
  studHeight: number,
  style: IronBandStyle,
): PixelPainter {
  return stackedPainters(
    ...bands.map((band) => rectPainter(band, heightInk(bandHeight))),
    ...bands.flatMap((band) =>
      studCentresAlong(band, style).map((centre) =>
        discPainter(centre, STUD_RADIUS, heightInk(studHeight)),
      ),
    ),
  );
}

function ironBandPainter(band: PixelRect, style: IronBandStyle): PixelPainter {
  return stackedPainters(pittedIronPainter(band, style), ...studPainters(band, style));
}

function pittedIronPainter(band: PixelRect, style: IronBandStyle): PixelPainter {
  const plate = beveledRectPainter(band, style.iron, 0.3);
  return (x, y) => {
    const ink = plate(x, y);
    if (!ink) return null;
    return pixelNoise(x, y, style.seed) < 0.14 ? darken(ink, 0.18) : ink;
  };
}

function studPainters(band: PixelRect, style: IronBandStyle): PixelPainter[] {
  return studCentresAlong(band, style).map((centre) =>
    stackedPainters(
      discPainter(centre, STUD_RADIUS, darken(style.stud, 0.4)),
      discPainter(shiftedTowardsLight(centre), STUD_HIGHLIGHT_RADIUS, lighten(style.stud, 0.1)),
    ),
  );
}

function studCentresAlong(band: PixelRect, style: IronBandStyle): PixelPoint[] {
  const centres: PixelPoint[] = [];
  const middleRow = band.top + (band.height - 1) / 2;
  for (let x = band.left + style.studInset; x < band.left + band.width; x += style.studSpacing) {
    centres.push({ x, y: middleRow });
  }
  return centres;
}

function shiftedTowardsLight(centre: PixelPoint): PixelPoint {
  return { x: centre.x - 0.5, y: centre.y - 0.5 };
}
