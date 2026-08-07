import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { pickByValue, pixelNoise, twoOctavePatchNoise } from '../artNoise';
import { darken, lighten } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { groundCubeArt } from '../groundCubeArt';
import { brickworkPainter } from '../painters/brickworkPainter';
import { crackPainter } from '../painters/crackPainter';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';

const ASH_GREYS = ['#575049', '#615952', '#6b635a', '#5c544d'] as const;
const HEDGE_GREENS = ['#24481f', '#2c5626', '#356a2d', '#2e5a28'] as const;
const CHAR_BLACKS = ['#221d1a', '#2b2521', '#342d28', '#272120'] as const;

export function ashFaceArt(): CubeFaceArt {
  return groundCubeArt(
    stackedPainters(
      patchPainter(ASH_GREYS, { seed: 0x8e01, cell: 8, size: SIZE }),
      specklePainter('#7f766c', 0x8e02, 0.1),
      specklePainter('#3c3631', 0x8e03, 0.08),
      cinderPainter(0x8e04),
    ),
    { surface: '#615952', soil: '#413b36', seed: 0x8e05 },
  );
}

export function scorchedStoneFaceArt(): CubeFaceArt {
  const courses = brickworkPainter(
    { courseHeight: 8, brickWidth: 16, stagger: 8 },
    { base: '#4e4a46', mortar: '#211e1b', seed: 0x8f01, size: SIZE, toneSpread: 0.24 },
  );
  const capstones = brickworkPainter(
    { courseHeight: 8, brickWidth: 8, stagger: 4 },
    { base: '#57524e', mortar: '#211e1b', seed: 0x8f02, size: SIZE, roundedCorners: true },
  );
  const emberSeams = crackPainter(['#d3773d', '#8a4a30', '#57342a'], { seed: 0x8f03, cell: 16, size: SIZE }, 0.03);
  return cubeArtFrom(SIZE, {
    top: stackedPainters(capstones, sootPainter(0x8f04)),
    sides: stackedPainters(courses, sootPainter(0x8f05), emberSeams),
    bottom: flatPainter('#1b1815'),
  });
}

export function hedgeFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(leafWallPainter(0x9001), specklePainter(lighten(HEDGE_GREENS[2], 0.22), 0x9002, 0.05)),
    sides: stackedPainters(leafWallPainter(0x9003), trimmedCoursePainter(0x9004)),
    bottom: flatPainter(darken(HEDGE_GREENS[0], 0.3)),
  });
}

export function charredTreeFaceArt(): CubeFaceArt {
  return cubeArtFrom(SIZE, {
    top: stackedPainters(charPainter(0x9101), specklePainter('#514840', 0x9102, 0.08)),
    sides: stackedPainters(charPainter(0x9103), barkSplitPainter(0x9104), dyingEmberPainter(0x9105)),
    bottom: flatPainter('#171310'),
  });
}

function cinderPainter(seed: number): PixelPainter {
  return (x, y) => {
    const spark = pixelNoise(x, y, seed);
    if (spark < 0.006) return '#e07840';
    if (spark < 0.014) return '#9c5636';
    return null;
  };
}

function sootPainter(seed: number): PixelPainter {
  return (x, y) => {
    const smudge = twoOctavePatchNoise(x, y, { seed, cell: 8, size: SIZE });
    return smudge < 0.3 ? darken('#4e4a46', 0.3 + (0.3 - smudge)) : null;
  };
}

function leafWallPainter(seed: number): PixelPainter {
  return (x, y) => {
    const clump = twoOctavePatchNoise(x, y, { seed, cell: 8, size: SIZE });
    const leaf = pickByValue(HEDGE_GREENS, clump);
    return pixelNoise(x, y, seed ^ 0x33) < 0.1 ? darken(leaf, 0.22) : leaf;
  };
}

function trimmedCoursePainter(seed: number): PixelPainter {
  return (x, y) => {
    if (y % 8 !== 0) return null;
    return darken(pickByValue(HEDGE_GREENS, pixelNoise(x, y, seed)), 0.2);
  };
}

function charPainter(seed: number): PixelPainter {
  return (x, y) => {
    const grain = twoOctavePatchNoise(x, y, { seed, cell: 8, size: SIZE });
    const char = pickByValue(CHAR_BLACKS, grain);
    return pixelNoise(x, y, seed ^ 0x51) < 0.1 ? lighten(char, 0.08) : char;
  };
}

function barkSplitPainter(seed: number): PixelPainter {
  return (x, y) => {
    const fissure = pixelNoise(Math.floor(x / 3), 7, seed);
    if (fissure < 0.22 && pixelNoise(x, y, seed ^ 0x9) < 0.75) return darken(CHAR_BLACKS[0], 0.35);
    return null;
  };
}

function dyingEmberPainter(seed: number): PixelPainter {
  return (x, y) => {
    if (y < SIZE - 9) return null;
    const glow = pixelNoise(x, y, seed);
    if (glow < 0.012) return '#d3672f';
    if (glow < 0.02) return '#8a4a30';
    return null;
  };
}
