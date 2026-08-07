import { armReach } from './paintDwarfArms';
import type { DwarfPainting } from './dwarfPainting';

const HANG_LENGTH = 13;

export interface LanternPoint {
  handX: number;
  handY: number;
  centerX: number;
  centerY: number;
}

export function dwarfLanternPoint(painting: DwarfPainting): LanternPoint {
  const hand = armReach(painting, painting.anatomy.lanternHand);
  return {
    handX: hand.handX,
    handY: hand.handY,
    centerX: hand.handX + painting.pose.lanternSwing * 3.5,
    centerY: hand.handY + HANG_LENGTH,
  };
}
