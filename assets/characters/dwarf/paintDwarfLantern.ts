import { mixInk } from '../../tiles/art/packedHex';
import { paintCapsule, paintEllipse, paintRowBand } from '../../creatures/art/paint/shapes';
import { dwarfLanternPoint } from './dwarfLanternPoint';
import { surfaceOf, type DwarfPainting } from './dwarfPainting';

const CAGE_HALF_WIDTH = 5;
const CAGE_HALF_HEIGHT = 6;

export function paintDwarfLantern(painting: DwarfPainting): void {
  const { handX, handY, centerX, centerY } = dwarfLanternPoint(painting);
  paintLanternGlow(painting, centerX, centerY);
  paintChain(painting, handX, handY, centerX, centerY);
  paintCage(painting, centerX, centerY);
  paintFlame(painting, centerX, centerY);
}

function paintLanternGlow(painting: DwarfPainting, centerX: number, centerY: number): void {
  const { palette, pose } = painting;
  const reach = 10 + pose.lanternFlare * 2.5;
  paintEllipse(
    painting.canvas,
    {
      centerX,
      centerY,
      radiusX: reach,
      radiusY: reach,
      feather: 1.1,
      opacity: 0.7,
    },
    (across, along) => {
      const nearness = 1 - Math.min(1, radialDistance(across, along));
      return mixInk(palette.ember, palette.emberCore, nearness * nearness);
    },
  );
}

function paintChain(
  painting: DwarfPainting,
  handX: number,
  handY: number,
  centerX: number,
  centerY: number,
): void {
  paintCapsule(
    painting.canvas,
    {
      fromX: handX,
      fromY: handY,
      toX: centerX,
      toY: centerY - CAGE_HALF_HEIGHT - 2,
      fromRadius: 1.1,
      toRadius: 1.4,
    },
    surfaceOf(painting, painting.palette.metal, 0.5),
  );
}

function paintCage(painting: DwarfPainting, centerX: number, centerY: number): void {
  const metal = surfaceOf(painting, painting.palette.metal, 0.55);
  paintRowBand(
    painting.canvas,
    {
      topY: centerY - CAGE_HALF_HEIGHT,
      bottomY: centerY + CAGE_HALF_HEIGHT,
      centerAt: () => centerX,
      halfWidthAt: (y) => CAGE_HALF_WIDTH - Math.abs(y - centerY) * 0.18,
    },
    metal,
  );
  for (const capY of [centerY - CAGE_HALF_HEIGHT, centerY + CAGE_HALF_HEIGHT]) {
    paintEllipse(
      painting.canvas,
      { centerX, centerY: capY, radiusX: CAGE_HALF_WIDTH + 1.6, radiusY: 1.8, feather: 1.8 },
      surfaceOf(painting, painting.palette.gold, 0.4),
    );
  }
}

function paintFlame(painting: DwarfPainting, centerX: number, centerY: number): void {
  const { palette, pose } = painting;
  paintEllipse(
    painting.canvas,
    {
      centerX,
      centerY,
      radiusX: 3,
      radiusY: 4 + pose.lanternFlare,
      feather: 2,
    },
    (across, along) =>
      mixInk(palette.emberCore, palette.ember, Math.min(1, radialDistance(across, along) * 1.1)),
  );
}

function radialDistance(across: number, along: number): number {
  return Math.sqrt(across * across + along * along);
}
