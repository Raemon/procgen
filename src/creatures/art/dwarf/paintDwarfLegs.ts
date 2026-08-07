import { paintCapsule, paintEllipse } from '../paint/shapes';
import { bodyX, liftedY, surfaceOf, type DwarfPainting } from './dwarfPainting';
import { DWARF_SKELETON } from './dwarfProportions';

const LEG_UNDERGLOW = 0.4;
const THIGH_RADIUS = 6.5;
const SHIN_RADIUS = 5.5;

export function paintDwarfLegs(painting: DwarfPainting): void {
  paintLeg(painting, 0);
  paintLeg(painting, 1);
}

function paintLeg(painting: DwarfPainting, index: 0 | 1): void {
  const swing = index === 0 ? painting.pose.stride : -painting.pose.stride;
  const stance = legStance(painting, index, swing);
  paintThigh(painting, stance);
  paintBoot(painting, stance);
  paintFoot(painting, stance);
}

interface LegStance {
  hipX: number;
  hipY: number;
  kneeX: number;
  kneeY: number;
  footX: number;
  footY: number;
}

function legStance(painting: DwarfPainting, index: 0 | 1, swing: number): LegStance {
  const { anatomy } = painting;
  const reach = anatomy.legsSwingSideways ? 8 : 3.5;
  const hipX = bodyX(painting, anatomy.legCenterX[index]);
  return {
    hipX,
    hipY: liftedY(painting, DWARF_SKELETON.hipY),
    kneeX: hipX + swing * reach * 0.5,
    kneeY: liftedY(painting, DWARF_SKELETON.kneeY),
    footX: hipX + swing * reach,
    footY: DWARF_SKELETON.groundY - Math.max(0, swing) * 4.5,
  };
}

function paintThigh(painting: DwarfPainting, stance: LegStance): void {
  paintCapsule(
    painting.canvas,
    {
      fromX: stance.hipX,
      fromY: stance.hipY,
      toX: stance.kneeX,
      toY: stance.kneeY,
      fromRadius: THIGH_RADIUS,
      toRadius: SHIN_RADIUS,
    },
    surfaceOf(painting, painting.palette.tunic, LEG_UNDERGLOW * 0.6),
  );
}

function paintBoot(painting: DwarfPainting, stance: LegStance): void {
  paintCapsule(
    painting.canvas,
    {
      fromX: stance.kneeX,
      fromY: stance.kneeY - 3,
      toX: stance.footX,
      toY: stance.footY - 2,
      fromRadius: SHIN_RADIUS + 0.5,
      toRadius: SHIN_RADIUS - 0.5,
    },
    surfaceOf(painting, painting.palette.leather, LEG_UNDERGLOW),
  );
  paintEllipse(
    painting.canvas,
    {
      centerX: stance.kneeX,
      centerY: stance.kneeY - 3,
      radiusX: SHIN_RADIUS + 1.5,
      radiusY: 2.2,
      feather: 1.8,
    },
    surfaceOf(painting, painting.palette.gold, LEG_UNDERGLOW),
  );
}

function paintFoot(painting: DwarfPainting, stance: LegStance): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: stance.footX + (painting.anatomy.faceTurn > 0 ? 1.5 : 0),
      centerY: stance.footY - 1.5,
      radiusX: SHIN_RADIUS + (painting.anatomy.faceTurn > 0 ? 2.5 : 1),
      radiusY: 3,
      feather: 2,
    },
    surfaceOf(painting, painting.palette.leather, LEG_UNDERGLOW),
  );
}
