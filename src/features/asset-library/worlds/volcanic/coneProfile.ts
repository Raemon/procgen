import { coneProfileAt, craterDipAt } from '../shape/pointStamp';
import type { WorldPoint } from '../values/chunkValues';
import { BORN, CHAIN_ID, CONE_HEIGHT, CONE_RADIUS, pointNumber } from '../values/pointData';
import { CONE_GROWTH_SPAN, type VolcanoCone } from './hotspotChains';

export { coneProfileAt, craterDipAt };

const YEARS_PER_SHOULDER_STEP = 1_000_000;

export interface AgingSpec {
  time: number;
  erosionHalfLife: number;
  shoulder: number;
}

export interface AgedCone {
  x: number;
  y: number;
  radius: number;
  height: number;
  young: boolean;
}

export function coneOfPoint(point: WorldPoint): VolcanoCone {
  return {
    x: point.x,
    y: point.y,
    born: pointNumber(point, BORN, 0),
    chainId: pointNumber(point, CHAIN_ID, 0),
    radius: pointNumber(point, CONE_RADIUS, 32),
    height: pointNumber(point, CONE_HEIGHT, 0.5),
  };
}

export function agedCone(cone: VolcanoCone, aging: AgingSpec): AgedCone | null {
  if (cone.born > aging.time) return null;
  const age = aging.time - cone.born;
  return {
    x: cone.x,
    y: cone.y,
    radius: cone.radius + (aging.shoulder * age) / YEARS_PER_SHOULDER_STEP,
    height: cone.height * Math.pow(0.5, age / aging.erosionHalfLife),
    young: age < CONE_GROWTH_SPAN,
  };
}

export function agedConeHeightAt(
  cone: AgedCone,
  worldX: number,
  worldY: number,
  craterDepth: number,
): number {
  const distance = Math.hypot(worldX - cone.x, worldY - cone.y);
  const profile = coneProfileAt(distance, cone.radius, cone.height);
  if (!cone.young || profile <= 0) return profile;
  return profile - craterDipAt(distance, cone.radius, craterDepth);
}
