import { paintCapsule, paintEllipse, paintRowBand } from '../../creatures/art/paint/shapes';
import { bodyX, liftedY, surfaceOf, type DwarfPainting } from './dwarfPainting';
import { DWARF_SKELETON } from './dwarfProportions';
import { torsoHalfWidthAt } from './dwarfSilhouette';

const TORSO_UNDERGLOW = 0.28;

export function paintDwarfTorso(painting: DwarfPainting): void {
  paintTunic(painting);
  paintBelt(painting);
  paintPauldrons(painting);
  if (painting.anatomy.showsFace) paintChestTrim(painting);
}

function paintTunic(painting: DwarfPainting): void {
  const { anatomy, pose } = painting;
  const topY = liftedY(painting, DWARF_SKELETON.neckY - 2);
  const bottomY = liftedY(painting, DWARF_SKELETON.hipY + 2);
  paintRowBand(
    painting.canvas,
    {
      topY,
      bottomY,
      centerAt: (y) => bodyX(painting, leanShift(painting, y)),
      halfWidthAt: (y) => torsoHalfWidthAt(anatomy, pose.breath, y - pose.bob),
    },
    surfaceOf(painting, painting.palette.tunic, TORSO_UNDERGLOW),
  );
}

function leanShift(painting: DwarfPainting, y: number): number {
  const height = (DWARF_SKELETON.hipY - y + painting.pose.bob) / 40;
  return painting.pose.lean * Math.max(0, height) * 1.6;
}

function paintBelt(painting: DwarfPainting): void {
  const { anatomy, pose } = painting;
  const centerY = liftedY(painting, DWARF_SKELETON.waistY + 1);
  paintRowBand(
    painting.canvas,
    {
      topY: centerY - 3,
      bottomY: centerY + 3,
      centerAt: () => bodyX(painting, 0),
      halfWidthAt: () => anatomy.waistHalfWidth + 1,
    },
    surfaceOf(painting, painting.palette.leather, TORSO_UNDERGLOW),
  );
  paintEllipse(
    painting.canvas,
    {
      centerX: bodyX(painting, anatomy.faceTurn * 5),
      centerY,
      radiusX: 4,
      radiusY: 3,
      feather: 2,
    },
    surfaceOf(painting, painting.palette.gold, TORSO_UNDERGLOW + pose.lanternFlare * 0.2),
  );
}

function paintPauldrons(painting: DwarfPainting): void {
  const { anatomy } = painting;
  const centerY = liftedY(painting, DWARF_SKELETON.shoulderY);
  for (const side of [-1, 1]) {
    paintEllipse(
      painting.canvas,
      {
        centerX: bodyX(painting, side * (anatomy.shoulderHalfWidth - 4)),
        centerY,
        radiusX: 8,
        radiusY: 6,
        feather: 2.2,
      },
      surfaceOf(painting, painting.palette.metal, 0.12),
    );
  }
}

function paintChestTrim(painting: DwarfPainting): void {
  const { anatomy } = painting;
  const throatX = bodyX(painting, anatomy.faceTurn * 4);
  const throatY = liftedY(painting, DWARF_SKELETON.neckY + 2);
  for (const side of [-1, 1]) {
    paintCapsule(
      painting.canvas,
      {
        fromX: throatX + side * anatomy.chestHalfWidth * 0.55,
        fromY: throatY,
        toX: throatX,
        toY: liftedY(painting, DWARF_SKELETON.chestY + 4),
        fromRadius: 1.6,
        toRadius: 1.2,
      },
      surfaceOf(painting, painting.palette.gold, 0.2),
    );
  }
  paintEllipse(
    painting.canvas,
    { centerX: throatX, centerY: throatY, radiusX: 3.4, radiusY: 3, feather: 2 },
    surfaceOf(painting, painting.palette.gold, 0.15),
  );
}
