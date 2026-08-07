import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { pickByValue, pixelNoise } from '../artNoise';
import { heightInk } from '../../faceArtHeight';
import { darken, lighten, mixHex, shadedRamp } from '../colorMath';
import { animatedCubeArt, cubeArtFrom, type CubeArtFramePainters } from '../cubeArtFrom';
import { crackPainter } from '../painters/crackPainter';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import {
  crestPainter,
  scrolledWaves,
  wavePainter,
  waveHeightPainter,
  type WaveStyle,
} from '../painters/wavePainter';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

const SHALLOW_WAVES = waveStyle(['#2f5f96', '#396ca4', '#4479b0', '#3d72a9'], 16, 2.2, 4);
const DEEP_WAVES = waveStyle(['#17335c', '#1c3c69', '#224676', '#1e416f'], 24, 3, 8);

const SWELL_MS = 200;
const SHALLOW_RELIEF = 0.4;
const DEEP_RELIEF = 0.3;

export function waterFaceArt(): CubeFaceArt {
  return animatedCubeArt(
    SIZE,
    rollingWaveFrames(SHALLOW_WAVES, SHALLOW_RELIEF, {
      crest: '#5b93c4',
      glints: specklePainter('#a8d3ea', 0x51a2, 0.018),
      sides: submergedSidePainter('#4479b0', '#16305a'),
      bottom: '#12284a',
    }),
    SWELL_MS,
  );
}

export function deepWaterFaceArt(): CubeFaceArt {
  return animatedCubeArt(
    SIZE,
    rollingWaveFrames(DEEP_WAVES, DEEP_RELIEF, {
      glints: specklePainter('#4d7fae', 0x7c31, 0.03),
      sides: submergedSidePainter('#1c3c69', '#0a1730'),
      bottom: '#0a1730',
    }),
    SWELL_MS,
  );
}

export function iceFaceArt(): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    {
      top: stackedPainters(
        patchPainter(shadedRamp('#b9dbe8', 5, 0.12), { seed: 0x1ce0, cell: 8, size: SIZE }),
        crackPainter(['#ffffff', '#dcecf4'], { seed: 0x1ce1, cell: 16, size: SIZE }, 0.028),
        specklePainter('#ffffff', 0x1ce2, 0.02),
      ),
      sides: frozenSidePainter('#a9cfdf'),
      bottom: flatPainter('#7fa9bd'),
    },
    {
      top: crackPainter(
        [heightInk(0.28), heightInk(0.36)],
        { seed: 0x1ce1, cell: 16, size: SIZE },
        0.028,
      ),
    },
  );
}

interface WaterSurface {
  crest?: string;
  glints: PixelPainter;
  sides: PixelPainter;
  bottom: string;
}

/** One frame per row of a wave band, so the swell lands back where it started. */
function rollingWaveFrames(
  style: WaveStyle,
  relief: number,
  surface: WaterSurface,
): CubeArtFramePainters[] {
  return [...Array(style.bandHeight).keys()].map((phase) =>
    waterFrame(scrolledWaves(style, phase), relief, surface, phase === 0),
  );
}

function waterFrame(
  style: WaveStyle,
  relief: number,
  surface: WaterSurface,
  submergedSides: boolean,
): CubeArtFramePainters {
  const top = stackedPainters(
    wavePainter(style),
    ...(surface.crest ? [crestPainter(surface.crest, style)] : []),
    surface.glints,
  );
  return {
    color: submergedSides
      ? { top, sides: surface.sides, bottom: flatPainter(surface.bottom) }
      : { top },
    height: { top: waveHeightPainter(style, relief) },
  };
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
