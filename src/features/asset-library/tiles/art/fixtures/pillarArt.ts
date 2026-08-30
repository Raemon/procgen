import { heightInk } from '../../faceArtHeight';
import type { CubeFaceArt } from '../../tileFaceArt';
import { TILE_ART_SIZE as SIZE } from '../artSize';
import { darken, lighten, shadedRamp } from '../colorMath';
import { cubeArtFrom } from '../cubeArtFrom';
import { patchPainter, specklePainter } from '../painters/grainPainters';
import {
  beveledRectPainter,
  rectPainter,
  type PixelRect,
} from '../painters/shapePainters';
import { stackedPainters, type PixelPainter } from '../pixelCanvas';

const PILLAR_STONE = '#7b7368';
const MORTAR = '#3b382f';
const COURSE_HEIGHT = 8;
const CAP: PixelRect = { left: 3, top: 3, width: 26, height: 26 };
const CAP_CORE: PixelRect = { left: 8, top: 8, width: 16, height: 16 };

export function pillarFaceArt(): CubeFaceArt {
  return cubeArtFrom(
    SIZE,
    { top: pillarCapPainter(), sides: pillarShaftPainter(), bottom: () => darken(MORTAR, 0.3) },
    { top: pillarCapReliefPainter(), sides: pillarShaftReliefPainter() },
  );
}

function pillarShaftPainter(): PixelPainter {
  return stackedPainters(
    stonePainter(0x9101),
    ...courseSeams().map((seam) => rectPainter(seam, MORTAR)),
    ...chamferedEdges().map((edge, side) =>
      rectPainter(edge, side === 0 ? lighten(PILLAR_STONE, 0.18) : darken(PILLAR_STONE, 0.3)),
    ),
  );
}

function pillarShaftReliefPainter(): PixelPainter {
  return stackedPainters(
    () => heightInk(0.72),
    ...courseSeams().map((seam) => rectPainter(seam, heightInk(0.5))),
    ...chamferedEdges().map((edge) => rectPainter(edge, heightInk(0.56))),
  );
}

function pillarCapPainter(): PixelPainter {
  return stackedPainters(
    stonePainter(0x9102),
    beveledRectPainter(CAP, lighten(PILLAR_STONE, 0.1), 0.26),
    beveledRectPainter(CAP_CORE, darken(PILLAR_STONE, 0.12), 0.3),
  );
}

function pillarCapReliefPainter(): PixelPainter {
  return stackedPainters(
    () => heightInk(0.55),
    rectPainter(CAP, heightInk(0.85)),
    rectPainter(CAP_CORE, heightInk(0.7)),
  );
}

function stonePainter(seed: number): PixelPainter {
  return stackedPainters(
    patchPainter(shadedRamp(PILLAR_STONE, 5, 0.14), { seed, cell: 12, size: SIZE }),
    specklePainter(darken(PILLAR_STONE, 0.22), seed ^ 0x2b, 0.09),
  );
}

function courseSeams(): PixelRect[] {
  const seams: PixelRect[] = [];
  for (let top = COURSE_HEIGHT; top < SIZE; top += COURSE_HEIGHT) {
    seams.push({ left: 0, top, width: SIZE, height: 1 });
  }
  return seams;
}

function chamferedEdges(): PixelRect[] {
  return [
    { left: 0, top: 0, width: 2, height: SIZE },
    { left: SIZE - 2, top: 0, width: 2, height: SIZE },
  ];
}
