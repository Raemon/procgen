import { sculptedInk } from '../../creatures/art/paint/sculptedInk';
import { paintColumnBand, paintEllipse } from '../../creatures/art/paint/shapes';
import { bodyX, liftedY, surfaceOf, type DwarfPainting } from './dwarfPainting';
import { DWARF_SKELETON } from './dwarfProportions';

const CLOAK_TOP_OFFSET = 4;
const FLARE_CURVE = 0.75;

export function paintDwarfCloak(painting: DwarfPainting): void {
  paintCloakFall(painting);
  paintShoulderMantle(painting);
}

function paintCloakFall(painting: DwarfPainting): void {
  const { anatomy, pose } = painting;
  const topY = liftedY(painting, DWARF_SKELETON.shoulderY - CLOAK_TOP_OFFSET);
  const hemY = liftedY(painting, DWARF_SKELETON.cloakHemY - pose.cloakLift * 4);
  const collarHalfWidth = anatomy.shoulderHalfWidth * 0.95;
  const hemHalfWidth = anatomy.cloakHalfWidth;
  const centerX = bodyX(painting, pose.cloakSway * 3);
  paintColumnBand(
    painting.canvas,
    {
      leftX: centerX - hemHalfWidth,
      rightX: centerX + hemHalfWidth,
      edgesAt: (x) =>
        cloakEdges(x - centerX, collarHalfWidth, hemHalfWidth, topY, hemY, pose.cloakSway),
    },
    (across, along) =>
      sculptedInk(
        painting.palette.cloak,
        painting.lighting,
        across + foldRipple(across, painting.pose.cloakSway),
        along,
        0.22,
      ),
  );
}

function cloakEdges(
  offsetX: number,
  collarHalfWidth: number,
  hemHalfWidth: number,
  topY: number,
  hemY: number,
  sway: number,
) {
  const reach = Math.abs(offsetX);
  if (reach > hemHalfWidth) return null;
  const emerges =
    reach <= collarHalfWidth
      ? 0
      : Math.pow((reach - collarHalfWidth) / (hemHalfWidth - collarHalfWidth), 1 / FLARE_CURVE);
  return {
    top: topY + emerges * (hemY - topY) + shoulderArch(offsetX, collarHalfWidth),
    bottom: hemY + hemWave(offsetX, sway),
  };
}

function shoulderArch(offsetX: number, collarHalfWidth: number): number {
  const reach = Math.min(1, Math.abs(offsetX) / collarHalfWidth);
  return reach * reach * 5;
}

function hemWave(offsetX: number, sway: number): number {
  return Math.sin(offsetX * 0.28 + sway * 2.4) * 3 + offsetX * sway * 0.13;
}

function foldRipple(across: number, sway: number): number {
  return Math.sin(across * 7.5 + sway * 1.6) * 0.24;
}

function paintShoulderMantle(painting: DwarfPainting): void {
  const { anatomy, pose } = painting;
  paintEllipse(
    painting.canvas,
    {
      centerX: bodyX(painting, pose.lean * 1.5),
      centerY: liftedY(painting, DWARF_SKELETON.shoulderY - 1),
      radiusX: anatomy.shoulderHalfWidth * 1.05,
      radiusY: 9,
      feather: 2.4,
    },
    surfaceOf(painting, painting.palette.cloak, 0.05),
  );
}
