import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { pixelNoise } from '../artNoise';
import { darken, lighten, shadedRamp } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { groundCubeArt } from '../groundCubeArt';
import { brickworkPainter } from '../painters/brickworkPainter';
import { crackPainter } from '../painters/crackPainter';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

export function rockFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(stoneMassPainter('#8b8b85', 0x6001), sunlitFacetPainter('#b6b6ae')),
    sides: stackedPainters(stoneMassPainter('#7b7b76', 0x6002), weatheredStreakPainter('#5f5f5a')),
    bottom: flatPainter('#4b4b47'),
  });
}

export function cobblestoneFaceArt(): CubeFaceArt {
  const cobbles = brickworkPainter(
    { courseHeight: 8, brickWidth: 8, stagger: 4 },
    { base: '#8a8f98', mortar: '#4c5158', seed: 0x6101, size: SIZE, roundedCorners: true, toneSpread: 0.22 },
  );
  return groundCubeArt(stackedPainters(cobbles, specklePainter('#6f747c', 0x6102, 0.09)), {
    surface: '#8a8f98',
    soil: '#5b5b52',
    seed: 0x6103,
  });
}

export function flagstoneFaceArt(): CubeFaceArt {
  const slabs = brickworkPainter(
    { courseHeight: 8, brickWidth: 16, stagger: 8 },
    { base: '#9aa0a8', mortar: '#5c6068', seed: 0x6201, size: SIZE, toneSpread: 0.12 },
  );
  return groundCubeArt(
    stackedPainters(slabs, specklePainter('#848a92', 0x6202, 0.07), specklePainter('#b3b8bf', 0x6203, 0.04)),
    { surface: '#9aa0a8', soil: '#5f5f58', seed: 0x6204 },
  );
}

export function stoneWallFaceArt(): CubeFaceArt {
  const courses = brickworkPainter(
    { courseHeight: 8, brickWidth: 16, stagger: 8 },
    { base: '#7d8189', mortar: '#4a4e55', seed: 0x6301, size: SIZE, toneSpread: 0.2 },
  );
  const capstones = brickworkPainter(
    { courseHeight: 8, brickWidth: 8, stagger: 4 },
    { base: '#8b8f96', mortar: '#4a4e55', seed: 0x6302, size: SIZE, roundedCorners: true },
  );
  return cubeArtFrom(SIZE, {
    top: stackedPainters(capstones, specklePainter('#a5a9af', 0x6303, 0.06)),
    sides: stackedPainters(courses, mossPainter('#4f6b3e', 0x6304)),
    bottom: flatPainter('#3f434a'),
  });
}

export function brickWallFaceArt(): CubeFaceArt {
  const bricks = brickworkPainter(
    { courseHeight: 8, brickWidth: 16, stagger: 8 },
    { base: '#a04c3a', mortar: '#c8b9a4', seed: 0x6401, size: SIZE, toneSpread: 0.14 },
  );
  return cubeArtFrom(SIZE, {
    top: stackedPainters(bricks, specklePainter('#8c4231', 0x6402, 0.08)),
    sides: stackedPainters(bricks, specklePainter('#7d3a2c', 0x6403, 0.06)),
    bottom: flatPainter('#5c2c22'),
  });
}

function stoneMassPainter(base: string, seed: number): PixelPainter {
  return stackedPainters(
    patchPainter(shadedRamp(base, 5, 0.2), { seed, cell: 16, size: SIZE }),
    crackPainter([darken(base, 0.45), darken(base, 0.22)], { seed: seed ^ 0x9d, cell: 8, size: SIZE }, 0.025),
    specklePainter(darken(base, 0.14), seed ^ 0x2e, 0.03),
    specklePainter(lighten(base, 0.14), seed ^ 0x3f, 0.025),
  );
}

function sunlitFacetPainter(highlight: string): PixelPainter {
  return (x, y) => (y < 5 && pixelNoise(x, y, 0x6009) < 0.4 ? lighten(highlight, 0.05) : null);
}

function weatheredStreakPainter(shadow: string): PixelPainter {
  return (x, y) => (pixelNoise(x, Math.floor(y / 6), 0x600a) < 0.1 ? darken(shadow, 0.1) : null);
}

function mossPainter(moss: string, seed: number): PixelPainter {
  return (x, y) => {
    if (y < SIZE - 10 || pixelNoise(x, y, seed) > 0.18) return null;
    return y > SIZE - 4 ? moss : lighten(moss, 0.1);
  };
}
