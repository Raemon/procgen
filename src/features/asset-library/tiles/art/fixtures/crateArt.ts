import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import {
  ironBandsPainter,
  ironBandsReliefPainter,
  type IronBandStyle,
} from '../painters/ironBandPainter';
import { plankPainter } from '../painters/plankPainter';
import {
  barPainter,
  discPainter,
  rectPainter,
  ringPainter,
  type PixelPoint,
  type PixelRect,
} from '../painters/shapePainters';
import { quarterTurned, stackedPainters, type PixelPainter } from '../pixelCanvas';

const TIMBER = '#a06a33';
const SEAM = '#3a2411';
const IRON = '#4e4a44';
const STUD = '#b3aa9a';
const SETTLED_IRON = '#2f7a46';
const SETTLED_STUD = '#8ff0a6';
const BOARD_WIDTH = 8;
const BAND_HEIGHT = 5;
const CORNER_POST_WIDTH = 3;
const BRACE_THICKNESS = 3.2;
const CENTRE: PixelPoint = { x: 16, y: 16 };

const SIDE_BANDS: PixelRect[] = [
  { left: 0, top: 3, width: SIZE, height: BAND_HEIGHT },
  { left: 0, top: SIZE - 8, width: SIZE, height: BAND_HEIGHT },
];
const CORNER_POSTS: PixelRect[] = [
  { left: 0, top: 0, width: CORNER_POST_WIDTH, height: SIZE },
  { left: SIZE - CORNER_POST_WIDTH, top: 0, width: CORNER_POST_WIDTH, height: SIZE },
];
const LID_RIM: PixelRect = { left: 0, top: 0, width: SIZE, height: SIZE };
const LID_RIM_THICKNESS = 3;

interface CrateMetal {
  iron: string;
  stud: string;
}

const LOOSE_METAL: CrateMetal = { iron: IRON, stud: STUD };
const SETTLED_METAL: CrateMetal = { iron: SETTLED_IRON, stud: SETTLED_STUD };

export function crateFaceArt(): CubeFaceArt {
  return crateArt(LOOSE_METAL);
}

export function crateOnPlateFaceArt(): CubeFaceArt {
  return crateArt(SETTLED_METAL);
}

function crateArt(metal: CrateMetal): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    { top: crateLidPainter(metal), sides: crateWallPainter(metal), bottom: flatUnderside() },
    { top: crateLidReliefPainter(), sides: crateWallReliefPainter() },
  );
}

function crateWallPainter(metal: CrateMetal): PixelPainter {
  return stackedPainters(
    boardsPainter(TIMBER, SEAM),
    bracePainter(darken(TIMBER, 0.22), lighten(TIMBER, 0.16)),
    ironBandsPainter(SIDE_BANDS, bandStyle(metal, 0xc101)),
    ...cornerPostPainters(metal),
  );
}

function crateWallReliefPainter(): PixelPainter {
  return stackedPainters(
    boardsPainter(heightInk(0.55), heightInk(0.4)),
    bracePainter(heightInk(0.68), heightInk(0.72)),
    ironBandsReliefPainter(SIDE_BANDS, 0.82, 0.98, bandStyle(LOOSE_METAL, 0xc101)),
    ...CORNER_POSTS.map((post) => rectPainter(post, heightInk(0.88))),
  );
}

function crateLidPainter(metal: CrateMetal): PixelPainter {
  return stackedPainters(
    quarterTurned(boardsPainter(lighten(TIMBER, 0.08), SEAM)),
    lidBracePainter(metal.iron),
    lidRimPainter(metal.iron),
    lidBoltPainter(metal),
  );
}

function crateLidReliefPainter(): PixelPainter {
  return stackedPainters(
    quarterTurned(boardsPainter(heightInk(0.6), heightInk(0.44))),
    lidBracePainter(heightInk(0.8)),
    lidRimPainter(heightInk(0.9)),
    discPainter(CENTRE, 3, heightInk(1)),
  );
}

function boardsPainter(base: string, seam: string): PixelPainter {
  return plankPainter({
    base,
    seam,
    seed: 0xc102,
    size: SIZE,
    plankHeight: BOARD_WIDTH,
    plankLength: SIZE,
  });
}

function bracePainter(shade: string, face: string): PixelPainter {
  return stackedPainters(
    ...diagonalsOfTheFace().map(([from, to]) =>
      stackedPainters(
        barPainter(from, to, BRACE_THICKNESS, shade),
        barPainter(from, to, BRACE_THICKNESS - 1.6, face),
      ),
    ),
  );
}

function lidBracePainter(iron: string): PixelPainter {
  return stackedPainters(
    ...diagonalsOfTheFace().map(([from, to]) => barPainter(from, to, BRACE_THICKNESS, iron)),
  );
}

function diagonalsOfTheFace(): [PixelPoint, PixelPoint][] {
  const [near, far] = [5, SIZE - 6];
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

function lidRimPainter(iron: string): PixelPainter {
  return (x, y) => (isWithinRimOf(LID_RIM, x, y) ? iron : null);
}

function isWithinRimOf(rim: PixelRect, x: number, y: number): boolean {
  const insideX = x - rim.left;
  const insideY = y - rim.top;
  const fromEdge = Math.min(insideX, insideY, rim.width - 1 - insideX, rim.height - 1 - insideY);
  return fromEdge < LID_RIM_THICKNESS;
}

function lidBoltPainter(metal: CrateMetal): PixelPainter {
  return stackedPainters(
    discPainter(CENTRE, 3.4, darken(metal.iron, 0.4)),
    discPainter(CENTRE, 2.4, metal.stud),
    ringPainter(CENTRE, 2.4, 1.4, darken(metal.stud, 0.35)),
  );
}

function cornerPostPainters(metal: CrateMetal): PixelPainter[] {
  return CORNER_POSTS.flatMap((post) => [
    rectPainter(post, metal.iron),
    rectPainter({ ...post, width: 1 }, lighten(metal.iron, 0.28)),
    ...postBoltsOf(post).map((bolt) =>
      stackedPainters(
        discPainter(bolt, 1.7, darken(metal.stud, 0.45)),
        discPainter({ x: bolt.x - 0.5, y: bolt.y - 0.5 }, 1, metal.stud),
      ),
    ),
  ]);
}

function postBoltsOf(post: PixelRect): PixelPoint[] {
  const x = post.left + (post.width - 1) / 2;
  return [14, 22].map((y) => ({ x, y }));
}

function bandStyle(metal: CrateMetal, seed: number): IronBandStyle {
  return { iron: metal.iron, stud: metal.stud, studSpacing: 7, studInset: 3, seed };
}

function flatUnderside(): PixelPainter {
  return () => '#2a1c0f';
}
