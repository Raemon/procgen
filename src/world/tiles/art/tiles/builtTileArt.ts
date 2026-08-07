import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { pickByValue, pixelNoise } from '../artNoise';
import { darken, lighten, shadedRamp } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { groundCubeArt } from '../groundCubeArt';
import { crackPainter } from '../painters/crackPainter';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import { plankPainter } from '../painters/plankPainter';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

export function woodPlanksFaceArt(): CubeFaceArt {
  const deck = plankPainter({
    base: '#8a6236',
    seam: '#4f3820',
    seed: 0x7101,
    size: SIZE,
    plankHeight: 8,
    plankLength: 16,
  });
  return groundCubeArt(deck, { surface: '#8a6236', soil: '#5a4022', seed: 0x7102, capHeight: 2 });
}

export function thatchRoofFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(thatchPainter(0x7201), specklePainter('#d8b25f', 0x7202, 0.05)),
    sides: stackedPainters(thatchPainter(0x7203), specklePainter('#7b5f2c', 0x7204, 0.06)),
    bottom: flatPainter('#5a4522'),
  });
}

export function lavaFaceArt(): CubeFaceArt {
  const crust = patchPainter(['#2a1a17', '#33201c', '#3d2620', '#2f1d19'], { seed: 0x7301, cell: 8, size: SIZE });
  const veins = crackPainter(['#ffe57a', '#ff9d3c', '#e8531f'], { seed: 0x7302, cell: 16, size: SIZE }, 0.05);
  return cubeArtFrom(SIZE, {
    top: stackedPainters(crust, veins, emberPainter(0x7303)),
    sides: stackedPainters(crust, moltenGlowSidePainter()),
    bottom: flatPainter('#1c110f'),
  });
}

function thatchPainter(seed: number): PixelPainter {
  const straw = shadedRamp('#b58f45', 5, 0.16);
  return (x, y) => {
    const row = Math.floor(y / 6);
    if (y % 6 === 0) return darken('#8a6a30', 0.2);
    return strawStrand(x, row, y, straw, seed);
  };
}

function strawStrand(
  x: number,
  row: number,
  y: number,
  straw: readonly string[],
  seed: number,
): string {
  const strand = pickByValue(straw, pixelNoise(x, row * 3 + (y % 3), seed));
  return y % 6 === 1 ? lighten(strand, 0.12) : strand;
}

function emberPainter(seed: number): PixelPainter {
  return (x, y) => (pixelNoise(x, y, seed) < 0.02 ? '#ffd15c' : null);
}

function moltenGlowSidePainter(): PixelPainter {
  return (x, y) => {
    if (y < SIZE - 8) return null;
    const glow = (y - (SIZE - 8)) / 8;
    return pixelNoise(x, y, 0x7304) < 0.25 + glow * 0.4 ? lighten('#c0431a', glow * 0.35) : null;
  };
}
