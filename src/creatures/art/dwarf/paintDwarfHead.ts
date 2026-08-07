import { mixInk, mixPacked, packHex } from '../../../world/tiles/art/packedHex';
import { paintCapsule, paintEllipse } from '../paint/shapes';
import { dwarfHeadFrame, faceFeatureX, faceFeatureY, type DwarfHeadFrame } from './dwarfHeadFrame';
import { surfaceOf, type DwarfPainting } from './dwarfPainting';
import { DWARF_SKELETON } from './dwarfProportions';

const HEAD_UNDERGLOW = 0.16;
const PROFILE_TURN = 0.85;

export function paintDwarfHead(painting: DwarfPainting): void {
  const head = dwarfHeadFrame(painting);
  paintNeck(painting, head);
  paintSkull(painting, head);
  paintJaw(painting, head);
  if (painting.anatomy.showsFace) paintFace(painting, head);
  paintCirclet(painting, head);
}

function paintNeck(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintCapsule(
    painting.canvas,
    {
      fromX: head.centerX,
      fromY: head.chinY - 3,
      toX: head.centerX,
      toY: faceFeatureY(head, DWARF_SKELETON.shoulderY),
      fromRadius: 6,
      toRadius: 7,
    },
    surfaceOf(painting, painting.palette.skin, 0.3),
  );
}

function paintSkull(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX,
      centerY: head.centerY - 2,
      radiusX: head.halfWidth,
      radiusY: head.halfHeight * 0.92,
      feather: 2.6,
    },
    surfaceOf(painting, painting.palette.skin, HEAD_UNDERGLOW),
  );
}

function paintJaw(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX + head.faceTurn * 1.5,
      centerY: head.chinY - 6,
      radiusX: head.halfWidth * 0.76,
      radiusY: 7.5,
      feather: 2.6,
    },
    surfaceOf(painting, painting.palette.skin, HEAD_UNDERGLOW + 0.1),
  );
  if (head.faceTurn > 0.3) paintNoseBridge(painting, head);
}

function paintNoseBridge(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: head.centerX + head.halfWidth * 0.88,
      centerY: faceFeatureY(head, DWARF_SKELETON.eyeY + 5),
      radiusX: 3.2,
      radiusY: 2.6,
      feather: 2,
    },
    surfaceOf(painting, painting.palette.skin, HEAD_UNDERGLOW),
  );
}

function paintFace(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintBrowShadow(painting, head);
  for (const offset of eyeOffsets(head)) paintEye(painting, head, offset);
  paintCheeks(painting, head);
  paintMouth(painting, head);
}

function eyeOffsets(head: DwarfHeadFrame): number[] {
  const spread = head.halfWidth * 0.44;
  return head.faceTurn >= PROFILE_TURN ? [spread] : [-spread, spread];
}

function paintBrowShadow(painting: DwarfPainting, head: DwarfHeadFrame): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: faceFeatureX(head, 0),
      centerY: faceFeatureY(head, DWARF_SKELETON.eyeY - 1),
      radiusX: head.halfWidth * 0.82,
      radiusY: 5,
      feather: 2,
      opacity: 0.4,
    },
    () => packHex(painting.palette.skin.shadow),
  );
}

function paintEye(painting: DwarfPainting, head: DwarfHeadFrame, offset: number): void {
  const { palette, pose } = painting;
  const x = faceFeatureX(head, offset);
  const y = faceFeatureY(head, DWARF_SKELETON.eyeY);
  paintEllipse(
    painting.canvas,
    { centerX: x, centerY: y, radiusX: 3.6, radiusY: 2.6, feather: 2 },
    () => mixInk(palette.eye, palette.eyeShine, 0.75),
  );
  paintEllipse(
    painting.canvas,
    { centerX: x + head.faceTurn * 0.6, centerY: y + 0.3, radiusX: 2.2, radiusY: 2.1, feather: 2 },
    (across, along) =>
      mixInk(palette.gem, palette.eye, 0.35 + radialDistance(across, along) * 0.45),
  );
  paintEllipse(
    painting.canvas,
    { centerX: x - 0.8, centerY: y - 0.8, radiusX: 0.9, radiusY: 0.9, feather: 1.4 },
    () => mixInk(palette.eyeShine, palette.emberCore, pose.lanternFlare * 0.5),
  );
  paintLashLine(painting, x, y);
  paintBrow(painting, x, y);
}

function paintLashLine(painting: DwarfPainting, x: number, y: number): void {
  paintCapsule(
    painting.canvas,
    { fromX: x - 4, fromY: y - 2.4, toX: x + 4, toY: y - 2.8, fromRadius: 1, toRadius: 0.8 },
    () => packHex(painting.palette.eye),
  );
}

function paintBrow(painting: DwarfPainting, x: number, y: number): void {
  paintCapsule(
    painting.canvas,
    { fromX: x - 4.5, fromY: y - 5.2, toX: x + 4, toY: y - 6.4, fromRadius: 1.3, toRadius: 1 },
    surfaceOf(painting, painting.palette.hair, 0),
  );
}

function paintCheeks(painting: DwarfPainting, head: DwarfHeadFrame): void {
  const blush = mixInk(painting.palette.skin.base, painting.palette.lip, 0.5);
  for (const offset of eyeOffsets(head)) {
    paintEllipse(
      painting.canvas,
      {
        centerX: faceFeatureX(head, offset * 1.06),
        centerY: faceFeatureY(head, DWARF_SKELETON.eyeY + 6),
        radiusX: 3.6,
        radiusY: 2.4,
        feather: 1.6,
        opacity: 0.4,
      },
      () => blush,
    );
  }
}

function paintMouth(painting: DwarfPainting, head: DwarfHeadFrame): void {
  const x = faceFeatureX(head, head.faceTurn >= PROFILE_TURN ? head.halfWidth * 0.3 : 0);
  const y = faceFeatureY(head, DWARF_SKELETON.chinY - 6);
  paintCapsule(
    painting.canvas,
    { fromX: x - 3, fromY: y, toX: x + 3, toY: y, fromRadius: 1.4, toRadius: 1.2 },
    () => mixInk(painting.palette.lip, painting.palette.skin.shadow, 0.25),
  );
}

function paintCirclet(painting: DwarfPainting, head: DwarfHeadFrame): void {
  const { palette, pose } = painting;
  const browY = faceFeatureY(head, DWARF_SKELETON.browY - 2);
  paintCapsule(
    painting.canvas,
    {
      fromX: head.centerX - head.halfWidth * 0.92,
      fromY: browY + 1.5,
      toX: head.centerX + head.halfWidth * 0.92,
      toY: browY + 1.5,
      fromRadius: 1.6,
      toRadius: 1.6,
    },
    surfaceOf(painting, palette.gold, 0.1),
  );
  if (!painting.anatomy.showsFace) return;
  paintEllipse(
    painting.canvas,
    {
      centerX: faceFeatureX(head, 0),
      centerY: browY + 1,
      radiusX: 2.6,
      radiusY: 2.6,
      feather: 2,
    },
    (across, along) =>
      mixPacked(
        mixInk(palette.gem, palette.emberCore, 0.25 + pose.lanternFlare * 0.35),
        packHex(palette.cloak.shadow),
        radialDistance(across, along) * 0.6,
      ),
  );
}

function radialDistance(across: number, along: number): number {
  return Math.sqrt(across * across + along * along);
}
