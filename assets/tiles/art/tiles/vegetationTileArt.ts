import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { pickByValue, pixelNoise, twoOctavePatchNoise } from '../artNoise';
import { darken, lighten } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { groundCubeArt } from '../groundCubeArt';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

type FoliagePalette = readonly [string, string, string, string];

const GRASS_GREENS = ['#3f6b34', '#48783a', '#528440', '#4a7b3b'] as const;
const LEAF_GREENS = ['#25532a', '#2d6331', '#377339', '#2f6a34'] as const;
const NEEDLE_GREENS = ['#1d4230', '#234f36', '#2b5d3d', '#254f37'] as const;

export function grassFaceArt(): CubeFaceArt {
  return groundCubeArt(grassTopPainter(0x2a01), { surface: '#4a7b3b', soil: '#6d5233', seed: 0x2a02 });
}

export function flowersFaceArt(): CubeFaceArt {
  return groundCubeArt(
    stackedPainters(grassTopPainter(0x2b01), blossomPainter(0x2b02)),
    { surface: '#4a7b3b', soil: '#6d5233', seed: 0x2b03 },
  );
}

export function treeFaceArt(): CubeFaceArt {
  return foliageCubeArt(LEAF_GREENS, 0x3c01);
}

export function pineTreeFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(canopyPainter(NEEDLE_GREENS, 0x3d01), needlePainter(0x3d02)),
    sides: stackedPainters(canopyPainter(NEEDLE_GREENS, 0x3d03), needlePainter(0x3d04)),
    bottom: flatPainter(darken(NEEDLE_GREENS[0], 0.35)),
  });
}

export function bushFaceArt(): CubeFaceArt {
  return foliageCubeArt(['#2f5f2c', '#396d33', '#437b3b', '#3a6f35'] as const, 0x3e01);
}

function foliageCubeArt(greens: FoliagePalette, seed: number): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(canopyPainter(greens, seed), specklePainter(lighten(greens[3], 0.2), seed ^ 0x77, 0.06)),
    sides: stackedPainters(
      canopyPainter(greens, seed ^ 0x1f),
      sunlitCrownPainter(greens[3]),
      undergrowthShadowPainter(greens[0]),
    ),
    bottom: flatPainter(darken(greens[0], 0.3)),
  });
}

function canopyPainter(greens: readonly string[], seed: number): PixelPainter {
  return (x, y) => {
    const clump = twoOctavePatchNoise(x, y, { seed, cell: 8, size: SIZE });
    const leaf = pickByValue(greens, clump);
    return isLeafEdge(x, y, seed) ? darken(leaf, 0.25) : leaf;
  };
}

function isLeafEdge(x: number, y: number, seed: number): boolean {
  return pixelNoise(x, y, seed ^ 0x51ed) < 0.12;
}

function sunlitCrownPainter(highlight: string): PixelPainter {
  return (x, y) => (y < 6 && pixelNoise(x, y, 0x4411) < 0.45 ? lighten(highlight, 0.22 - y * 0.03) : null);
}

function undergrowthShadowPainter(shadow: string): PixelPainter {
  return (x, y) => (y > SIZE - 7 && pixelNoise(x, y, 0x4412) < 0.5 ? darken(shadow, (y - SIZE + 7) * 0.03) : null);
}

function needlePainter(seed: number): PixelPainter {
  return (x, y) => {
    const bough = twoOctavePatchNoise(x, y, { seed, cell: 8, size: SIZE });
    if ((x + y) % 4 === 0 && bough > 0.55) return lighten(NEEDLE_GREENS[2], 0.16);
    if ((x - y + SIZE) % 4 === 0 && bough < 0.4) return darken(NEEDLE_GREENS[0], 0.2);
    return null;
  };
}

function grassTopPainter(seed: number): PixelPainter {
  return stackedPainters(
    patchPainter(GRASS_GREENS, { seed, cell: 8, size: SIZE }),
    bladePainter(seed ^ 0x9a1),
  );
}

function bladePainter(seed: number): PixelPainter {
  return (x, y) => {
    const blade = pixelNoise(x, Math.floor(y / 2), seed);
    if (blade < 0.07) return lighten(GRASS_GREENS[2], 0.18);
    if (blade > 0.94) return darken(GRASS_GREENS[0], 0.18);
    return null;
  };
}

function blossomPainter(seed: number): PixelPainter {
  const petals = ['#e8d36a', '#dc6f6f', '#d9d3e8', '#e39a4f'];
  return (x, y) => {
    const [cellX, cellY] = [Math.floor(x / 4), Math.floor(y / 4)];
    if (pixelNoise(cellX, cellY, seed) > 0.16) return null;
    return blossomPixel(x % 4, y % 4, pickByValue(petals, pixelNoise(cellY, cellX, seed ^ 0x5)));
  };
}

function blossomPixel(localX: number, localY: number, petal: string): string | null {
  const onPetal = (localX === 1 || localX === 2) && (localY === 1 || localY === 2);
  if (!onPetal) return null;
  return localX === 1 && localY === 1 ? lighten(petal, 0.25) : petal;
}
