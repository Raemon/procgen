import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { pickByValue, pixelNoise } from '../artNoise';
import { darken, lighten, mixHex, shadedRamp } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { crackPainter } from '../painters/crackPainter';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import { crestPainter, wavePainter, type WaveStyle } from '../painters/wavePainter';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

const SHALLOW_WAVES = waveStyle(['#2f5f96', '#396ca4', '#4479b0', '#3d72a9'], 16, 2.2, 4);
const DEEP_WAVES = waveStyle(['#17335c', '#1c3c69', '#224676', '#1e416f'], 24, 3, 8);

export function waterFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(
      wavePainter(SHALLOW_WAVES),
      crestPainter('#5b93c4', SHALLOW_WAVES),
      specklePainter('#a8d3ea', 0x51a2, 0.018),
    ),
    sides: submergedSidePainter('#4479b0', '#16305a'),
    bottom: flatPainter('#12284a'),
  });
}

export function deepWaterFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(wavePainter(DEEP_WAVES), specklePainter('#4d7fae', 0x7c31, 0.03)),
    sides: submergedSidePainter('#1c3c69', '#0a1730'),
    bottom: flatPainter('#0a1730'),
  });
}

export function iceFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(
      patchPainter(shadedRamp('#b9dbe8', 5, 0.12), { seed: 0x1ce0, cell: 8, size: SIZE }),
      crackPainter(['#ffffff', '#dcecf4'], { seed: 0x1ce1, cell: 16, size: SIZE }, 0.028),
      specklePainter('#ffffff', 0x1ce2, 0.02),
    ),
    sides: frozenSidePainter('#a9cfdf'),
    bottom: flatPainter('#7fa9bd'),
  });
}

function waveStyle(
  palette: readonly string[],
  wavelength: number,
  amplitude: number,
  bandHeight: number,
): WaveStyle {
  return { palette, wavelength, amplitude, bandHeight, size: SIZE };
}

function submergedSidePainter(waterline: string, deepColor: string): PixelPainter {
  return (x, y) => {
    if (y < 2) return lighten(waterline, 0.3 - 0.1 * y);
    const depth = mixHex(waterline, deepColor, y / SIZE);
    return pixelNoise(x, y, 0x2b17) < 0.12 ? lighten(depth, 0.08) : depth;
  };
}

function frozenSidePainter(base: string): PixelPainter {
  const columns = shadedRamp(base, 4, 0.16);
  return (x, y) => {
    const column = pickByValue(columns, pixelNoise(Math.floor(x / 3), 0, 0x1ce3));
    return darken(column, (0.35 * y) / SIZE);
  };
}
