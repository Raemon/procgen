import { mixPacked, packHex } from '../../../world/tiles/art/packedHex';
import { sculptedInk } from '../paint/sculptedInk';
import { paintCapsule, paintEllipse, type SurfaceShade } from '../paint/shapes';
import { dwarfHeadFrame, faceFeatureY, type DwarfHeadFrame } from './dwarfHeadFrame';
import { surfaceOf, type DwarfPainting } from './dwarfPainting';
import { DWARF_SKELETON } from './dwarfProportions';

const BRAID_BEADS = 15;
const HAIR_UNDERGLOW = 0.12;

export function paintDwarfHairBehind(painting: DwarfPainting): void {
  const head = dwarfHeadFrame(painting);
  paintHairMass(painting, head);
  if (!painting.anatomy.braidsInFront) paintBraids(painting, head);
}

export function paintDwarfHairInFront(painting: DwarfPainting): void {
  const head = dwarfHeadFrame(painting);
  if (!painting.anatomy.showsFace) paintTurnedAwayHair(painting, head);
  paintCrown(painting, head);
  if (painting.anatomy.braidsInFront) paintBraids(painting, head);
}

function paintTurnedAwayHair(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX - head.faceTurn * 2,
      centerY: head.centerY - 1,
      radiusX: head.halfWidth * 1.02,
      radiusY: head.halfHeight * 0.98,
      feather: 2.6,
    },
    surfaceOf(painting, painting.palette.hair, HAIR_UNDERGLOW),
  );
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX - head.faceTurn * 3 + painting.pose.braidSway,
      centerY: head.chinY + 2,
      radiusX: head.halfWidth * 0.72,
      radiusY: 7,
      feather: 2.4,
    },
    strandedHair(painting),
  );
}

function strandedHair(painting: DwarfPainting): SurfaceShade {
  return (across, along) =>
    sculptedInk(
      painting.palette.hair,
      painting.lighting,
      across + Math.sin(across * 9.5) * 0.3,
      along,
      HAIR_UNDERGLOW,
    );
}

function paintHairMass(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX - head.faceTurn * 3,
      centerY: head.centerY + 2,
      radiusX: head.halfWidth * 1.16,
      radiusY: head.halfHeight * 1.12,
      feather: 2.6,
    },
    surfaceOf(painting, painting.palette.hair, HAIR_UNDERGLOW),
  );
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX - head.faceTurn * 5 + painting.pose.braidSway * 1.5,
      centerY: faceFeatureY(head, DWARF_SKELETON.shoulderY + 4),
      radiusX: head.halfWidth * 1.05,
      radiusY: 14,
      feather: 2.6,
    },
    strandedHair(painting),
  );
}

function paintCrown(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX - head.faceTurn * 2,
      centerY: head.crownY + 7,
      radiusX: head.halfWidth * 1.04,
      radiusY: 8,
      feather: 2.4,
    },
    surfaceOf(painting, painting.palette.hair, 0),
  );
  paintPartedFringe(painting, head);
}

function paintPartedFringe(painting: DwarfPainting, head: DwarfHeadFrame): void {
  for (const side of [-1, 1]) {
    paintCapsule(
      painting.canvas,
      {
        fromX: head.centerX + side * 1.5,
        fromY: head.crownY + 3,
        toX: head.centerX + side * head.halfWidth * 1.02,
        toY: faceFeatureY(head, DWARF_SKELETON.browY + 4),
        fromRadius: 3.5,
        toRadius: 3,
      },
      surfaceOf(painting, painting.palette.hair, 0),
    );
  }
}

function paintBraids(painting: DwarfPainting, head: DwarfHeadFrame): void {
  for (const side of [-1, 1]) paintBraid(painting, head, side);
}

function paintBraid(painting: DwarfPainting, head: DwarfHeadFrame, side: number): void {
  const startX = head.centerX + side * head.halfWidth * 0.88;
  const startY = head.chinY - 10;
  const endY = faceFeatureY(head, DWARF_SKELETON.braidEndY);
  for (let bead = 0; bead < BRAID_BEADS; bead++) {
    paintBraidBead(painting, braidBeadAt(painting, startX, startY, endY, side, bead));
  }
  paintBraidRing(painting, braidBeadAt(painting, startX, startY, endY, side, BRAID_BEADS - 2));
}

interface BraidBead {
  x: number;
  y: number;
  radius: number;
  weave: number;
}

function braidBeadAt(
  painting: DwarfPainting,
  startX: number,
  startY: number,
  endY: number,
  side: number,
  bead: number,
): BraidBead {
  const t = bead / (BRAID_BEADS - 1);
  const sway = painting.pose.braidSway * Math.pow(t, 1.6) * 7;
  const weave = bead % 2 === 0 ? 1 : -1;
  return {
    x: startX + side * t * 2.5 + sway + weave * 1.1 * (1 - t * 0.4),
    y: startY + (endY - startY) * t,
    radius: 4.6 - t * 2.4,
    weave,
  };
}

function paintBraidBead(painting: DwarfPainting, bead: BraidBead): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: bead.x,
      centerY: bead.y,
      radiusX: bead.radius,
      radiusY: bead.radius * 0.85,
      feather: 2.2,
    },
    (across, along) =>
      mixPacked(
        strandedHair(painting)(across, along),
        packHex(painting.palette.hair.shadow),
        bead.weave > 0 ? 0 : 0.28,
      ),
  );
}

function paintBraidRing(painting: DwarfPainting, bead: BraidBead): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: bead.x,
      centerY: bead.y,
      radiusX: bead.radius + 0.8,
      radiusY: 1.6,
      feather: 1.8,
    },
    surfaceOf(painting, painting.palette.gold, 0.2),
  );
}
