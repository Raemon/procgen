import { paintCapsule, paintEllipse } from '../paint/shapes';
import { bodyX, liftedY, surfaceOf, type DwarfPainting } from './dwarfPainting';
import { DWARF_SKELETON } from './dwarfProportions';

const ARM_UNDERGLOW = 0.3;

export interface ArmReach {
  shoulderX: number;
  shoulderY: number;
  elbowX: number;
  elbowY: number;
  handX: number;
  handY: number;
}

export function armReach(painting: DwarfPainting, index: 0 | 1): ArmReach {
  const { anatomy, pose } = painting;
  const holdsLantern = anatomy.lanternHand === index;
  const swing = (index === 0 ? pose.armSwing : -pose.armSwing) * (holdsLantern ? 0.45 : 1);
  const reach = anatomy.legsSwingSideways ? 7 : 3;
  const shoulderX = bodyX(painting, anatomy.armCenterX[index] * 0.82);
  return {
    shoulderX,
    shoulderY: liftedY(painting, DWARF_SKELETON.shoulderY + 2),
    elbowX: shoulderX + swing * reach * 0.5 + outward(anatomy.armCenterX[index], 1.5),
    elbowY: liftedY(painting, DWARF_SKELETON.chestY + 8),
    handX: shoulderX + swing * reach + outward(anatomy.armCenterX[index], 1),
    handY: liftedY(painting, DWARF_SKELETON.handY + pose.lanternSwing * (holdsLantern ? 1.5 : 0)),
  };
}

export function paintDwarfArm(painting: DwarfPainting, index: 0 | 1): void {
  const reach = armReach(painting, index);
  paintSleeve(painting, reach);
  paintBracer(painting, reach);
  paintHand(painting, reach);
}

function paintSleeve(painting: DwarfPainting, reach: ArmReach): void {
  paintCapsule(
    painting.canvas,
    {
      fromX: reach.shoulderX,
      fromY: reach.shoulderY,
      toX: reach.elbowX,
      toY: reach.elbowY,
      fromRadius: 5.5,
      toRadius: 4.2,
    },
    surfaceOf(painting, painting.palette.tunic, ARM_UNDERGLOW * 0.5),
  );
}

function paintBracer(painting: DwarfPainting, reach: ArmReach): void {
  paintCapsule(
    painting.canvas,
    {
      fromX: reach.elbowX,
      fromY: reach.elbowY,
      toX: reach.handX,
      toY: reach.handY - 3,
      fromRadius: 4.2,
      toRadius: 3.4,
    },
    surfaceOf(painting, painting.palette.leather, ARM_UNDERGLOW),
  );
}

function paintHand(painting: DwarfPainting, reach: ArmReach): void {
  paintEllipse(
    painting.canvas,
    {
      centerX: reach.handX,
      centerY: reach.handY,
      radiusX: 3.6,
      radiusY: 3.2,
      feather: 2,
    },
    surfaceOf(painting, painting.palette.skin, ARM_UNDERGLOW + 0.15),
  );
}

function outward(armCenterX: number, amount: number): number {
  return Math.sign(armCenterX) * amount;
}
