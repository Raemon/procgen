import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten, mixHex } from '../colorMath';
import { animatedCubeArt, type CubeArtFramePainters } from '../cubeArtFrom';
import {
  barPainter,
  discPainter,
  rectPainter,
  ringPainter,
  type PixelPoint,
  type PixelRect,
} from '../painters/shapePainters';
import { flatPainter, stackedPainters, type PixelPainter } from '../pixelCanvas';
import { rememberedArt } from '../rememberedArt';

export const ARCANE_CORE = '#4fd8ff';

const IRON = '#8492a6';
const PLATE_IRON = '#333b48';
const BOLT = '#a7aeb9';
const UNDERSIDE = '#1a1c22';
const FRAME_THICKNESS = 4;
const CENTRE: PixelPoint = { x: (SIZE - 1) / 2, y: (SIZE - 1) / 2 };
const WINDOW: PixelRect = { left: 4, top: 4, width: SIZE - 8, height: SIZE - 8 };
const CAGE_THICKNESS = 2.8;
const COLLAR_OUTER = 10.4;
const COLLAR_INNER = 8.6;
const VEIN_THICKNESS = 2.2;
const PULSE_MS = 380;
const BOLT_CENTRES: PixelPoint[] = [
  { x: 3, y: 3 },
  { x: SIZE - 4, y: 3 },
  { x: 3, y: SIZE - 4 },
  { x: SIZE - 4, y: SIZE - 4 },
];

interface CoreGlow {
  hue: string;
  swell: number;
  brightness: number;
  haloed: boolean;
}

const dormantArt = new Map<string, CubeFaceArt>();
const chargedArt = new Map<string, CubeFaceArt>();

export function crateFaceArt(core: string = ARCANE_CORE): CubeFaceArt {
  return rememberedArt(dormantArt, core, () =>
    animatedCubeArt(SIZE, [crateFrame({ hue: core, swell: 0.85, brightness: 0.55, haloed: false })]),
  );
}

export function crateOnPlateFaceArt(core: string = ARCANE_CORE): CubeFaceArt {
  return rememberedArt(chargedArt, core, () =>
    animatedCubeArt(
      SIZE,
      [
        crateFrame({ hue: core, swell: 1, brightness: 1, haloed: true }),
        crateFrame({ hue: core, swell: 1.12, brightness: 1.15, haloed: true }),
      ],
      PULSE_MS,
    ),
  );
}

function crateFrame(glow: CoreGlow): CubeArtFramePainters {
  return {
    color: {
      top: cagedCorePainter(glow, lidSpokesPainter()),
      sides: cagedCorePainter(glow, crossBracesPainter()),
      bottom: flatPainter(UNDERSIDE),
    },
    height: {
      top: cagedCoreReliefPainter(glow, lidSpokesReliefPainter()),
      sides: cagedCoreReliefPainter(glow, crossBracesReliefPainter()),
    },
  };
}

function cagedCorePainter(glow: CoreGlow, cage: PixelPainter): PixelPainter {
  return stackedPainters(
    ironPlatePainter(),
    windowPainter(glow),
    ...veinPainters(glow),
    corePainter(glow),
    cage,
    ringPainter(CENTRE, COLLAR_OUTER, COLLAR_INNER, darken(IRON, 0.4)),
    framePainter(),
    ...boltPainters(),
  );
}

function cagedCoreReliefPainter(glow: CoreGlow, cage: PixelPainter): PixelPainter {
  return stackedPainters(
    flatPainter(heightInk(0.5)),
    rectPainter(WINDOW, heightInk(0.35)),
    ...veinsOf().map(([from, to]) => barPainter(from, to, VEIN_THICKNESS, heightInk(0.45))),
    discPainter(CENTRE, 8 * glow.swell, heightInk(0.6)),
    discPainter(CENTRE, 4.6 * glow.swell, heightInk(0.74)),
    cage,
    ringPainter(CENTRE, COLLAR_OUTER, COLLAR_INNER, heightInk(0.8)),
    (x, y) => (isWithinFrame(x, y) ? heightInk(0.88) : null),
    ...BOLT_CENTRES.map((bolt) => discPainter(bolt, 1.7, heightInk(0.98))),
  );
}

function ironPlatePainter(): PixelPainter {
  return flatPainter(PLATE_IRON);
}

function windowPainter(glow: CoreGlow): PixelPainter {
  const recess = mixHex(darken(PLATE_IRON, 0.45), glow.hue, 0.18 * glow.brightness);
  return rectPainter(WINDOW, recess);
}

function corePainter(glow: CoreGlow): PixelPainter {
  const lit = (amount: number) => mixHex(darken(glow.hue, 1 - glow.brightness), '#ffffff', amount * glow.brightness);
  const halo = glow.haloed ? [ringPainter(CENTRE, 11.6 * glow.swell, 10.2 * glow.swell, darken(glow.hue, 0.35))] : [];
  return stackedPainters(
    ...halo,
    discPainter(CENTRE, 8.4 * glow.swell, darken(glow.hue, 0.5)),
    discPainter(CENTRE, 7.2 * glow.swell, lit(0)),
    discPainter(CENTRE, 5 * glow.swell, lit(0.35)),
    discPainter(CENTRE, 2.8 * glow.swell, lit(0.75)),
  );
}

function veinPainters(glow: CoreGlow): PixelPainter[] {
  const ink = darken(glow.hue, 0.75 - 0.45 * glow.brightness);
  return veinsOf().map(([from, to]) => barPainter(from, to, VEIN_THICKNESS, ink));
}

function veinsOf(): [PixelPoint, PixelPoint][] {
  const reach = WINDOW.width / 2;
  return [
    [CENTRE, { x: CENTRE.x, y: CENTRE.y - reach }],
    [CENTRE, { x: CENTRE.x + reach, y: CENTRE.y }],
    [CENTRE, { x: CENTRE.x, y: CENTRE.y + reach }],
    [CENTRE, { x: CENTRE.x - reach, y: CENTRE.y }],
  ];
}

function crossBracesPainter(): PixelPainter {
  return stackedPainters(...windowDiagonals().map(([from, to]) => cageBarPainter(from, to)));
}

function crossBracesReliefPainter(): PixelPainter {
  return stackedPainters(
    ...windowDiagonals().map(([from, to]) => barPainter(from, to, CAGE_THICKNESS, heightInk(0.8))),
  );
}

function lidSpokesPainter(): PixelPainter {
  return stackedPainters(...veinsOf().map(([from, to]) => cageBarPainter(from, to)));
}

function lidSpokesReliefPainter(): PixelPainter {
  return stackedPainters(...veinsOf().map(([from, to]) => barPainter(from, to, CAGE_THICKNESS, heightInk(0.8))));
}

function cageBarPainter(from: PixelPoint, to: PixelPoint): PixelPainter {
  return stackedPainters(
    barPainter(from, to, CAGE_THICKNESS, darken(IRON, 0.3)),
    barPainter(from, to, CAGE_THICKNESS - 1.4, lighten(IRON, 0.05)),
  );
}

function windowDiagonals(): [PixelPoint, PixelPoint][] {
  const [near, far] = [WINDOW.left, WINDOW.left + WINDOW.width - 1];
  return [
    [
      { x: near, y: near },
      { x: far, y: far },
    ],
    [
      { x: far, y: near },
      { x: near, y: far },
    ],
  ];
}

function framePainter(): PixelPainter {
  return (x, y) => {
    if (!isWithinFrame(x, y)) return null;
    if (x < FRAME_THICKNESS || y < FRAME_THICKNESS) return lighten(IRON, 0.18);
    if (x >= SIZE - FRAME_THICKNESS || y >= SIZE - FRAME_THICKNESS) return darken(IRON, 0.28);
    return IRON;
  };
}

function isWithinFrame(x: number, y: number): boolean {
  return Math.min(x, y, SIZE - 1 - x, SIZE - 1 - y) < FRAME_THICKNESS;
}

function boltPainters(): PixelPainter[] {
  return BOLT_CENTRES.map((bolt) =>
    stackedPainters(
      discPainter(bolt, 1.7, darken(BOLT, 0.5)),
      discPainter({ x: bolt.x - 0.4, y: bolt.y - 0.4 }, 1, BOLT),
    ),
  );
}
