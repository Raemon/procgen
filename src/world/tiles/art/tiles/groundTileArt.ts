import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { patchNoise, pixelNoise } from '../artNoise';
import { darken, lighten, shadedRamp } from '../colorMath';
import { groundCubeArt } from '../groundCubeArt';
import { brickworkPainter } from '../painters/brickworkPainter';
import { clusteredSpecklePainter, patchPainter, specklePainter } from '../painters/grainPainters';
import { wavePainter } from '../painters/wavePainter';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';

export function sandFaceArt(): CubeFaceArt {
  const ripples = wavePainter({
    palette: ['#d3ba72', '#dcc582', '#e6d195', '#dcc582'],
    wavelength: 32,
    amplitude: 4,
    bandHeight: 8,
    size: SIZE,
  });
  return groundCubeArt(
    stackedPainters(ripples, specklePainter('#f2e3ae', 0x5a11, 0.08), specklePainter('#b99f5c', 0x5a12, 0.08)),
    { surface: '#dcc582', soil: '#b08f52', seed: 0x5a13 },
  );
}

export function dirtPathFaceArt(): CubeFaceArt {
  return groundCubeArt(
    stackedPainters(
      patchPainter(shadedRamp('#8a6a45', 5, 0.14), { seed: 0x40a1, cell: 8, size: SIZE }),
      specklePainter('#6b4f31', 0x40a2, 0.12),
      pebblePainter('#a9946f', 0x40a3),
    ),
    { surface: '#8a6a45', soil: '#6d5233', seed: 0x40a4 },
  );
}

export function gravelFaceArt(): CubeFaceArt {
  const pebbles = brickworkPainter(
    { courseHeight: 4, brickWidth: 4, stagger: 2 },
    { base: '#8d8d88', mortar: '#57574f', seed: 0x6b01, size: SIZE, toneSpread: 0.32 },
  );
  return groundCubeArt(
    stackedPainters(
      pebbles,
      clusteredSpecklePainter(shadedRamp('#a8a8a1', 3, 0.12), { seed: 0x6b02, cell: 8, size: SIZE }, 0.12),
      specklePainter('#55554f', 0x6b03, 0.04),
    ),
    { surface: '#8d8d88', soil: '#6a6a64', seed: 0x6b04 },
  );
}

export function marshFaceArt(): CubeFaceArt {
  return groundCubeArt(
    stackedPainters(
      patchPainter(['#4a5a3a', '#55663f', '#5f7046', '#4f6140'], { seed: 0x7d01, cell: 8, size: SIZE }),
      puddlePainter('#3f5b62', 0x7d02),
      reedPainter('#7c8f4e', 0x7d03),
    ),
    { surface: '#55663f', soil: '#40402e', seed: 0x7d04 },
  );
}

export function snowFaceArt(): CubeFaceArt {
  return groundCubeArt(
    stackedPainters(
      patchPainter(['#e8eef5', '#f2f6fa', '#fbfdff', '#eaf0f7'], { seed: 0x9c01, cell: 8, size: SIZE }),
      driftShadowPainter('#c8d6e6', 0x9c02),
      specklePainter('#ffffff', 0x9c03, 0.05),
    ),
    { surface: '#f2f6fa', soil: '#b9c6d4', seed: 0x9c04, capHeight: 5 },
  );
}

export function farmlandFaceArt(): CubeFaceArt {
  const furrows = wavePainter({
    palette: ['#5f4529', '#6d5030', '#7b5c39', '#6d5030'],
    wavelength: 32,
    amplitude: 1.5,
    bandHeight: 4,
    size: SIZE,
  });
  return groundCubeArt(
    stackedPainters(furrows, specklePainter('#4b3620', 0x8e01, 0.1), sproutPainter('#6f9a45', 0x8e02)),
    { surface: '#6d5030', soil: '#4f3a22', seed: 0x8e03 },
  );
}

function pebblePainter(color: string, seed: number): PixelPainter {
  return (x, y) => {
    if (pixelNoise(x, y, seed) > 0.05) return null;
    return pixelNoise(x, y, seed ^ 0x11) < 0.5 ? color : darken(color, 0.25);
  };
}

function puddlePainter(color: string, seed: number): PixelPainter {
  return (x, y) => {
    const wetness = patchNoise(x, y, { seed, cell: 8, size: SIZE });
    if (wetness > 0.34) return null;
    return wetness < 0.24 ? color : lighten(color, 0.12);
  };
}

function reedPainter(color: string, seed: number): PixelPainter {
  return (x, y) => {
    if (pixelNoise(x, Math.floor(y / 4), seed) > 0.06) return null;
    return y % 4 === 0 ? lighten(color, 0.2) : color;
  };
}

function driftShadowPainter(color: string, seed: number): PixelPainter {
  return (x, y) => (patchNoise(x, y, { seed, cell: 8, size: SIZE }) < 0.3 ? color : null);
}

function sproutPainter(color: string, seed: number): PixelPainter {
  return (x, y) => {
    if (y % 4 !== 2 || pixelNoise(x, y, seed) > 0.4) return null;
    return pixelNoise(x, y, seed ^ 0x33) < 0.4 ? lighten(color, 0.18) : color;
  };
}
