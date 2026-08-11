import { CONE_GROWTH_SPAN, type VolcanoCone } from './hotspotChains';

const PROFILE_EXPONENT = 1.6;
const CRATER_BOWL = 0.18;
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

export function coneProfileAt(distance: number, radius: number, height: number): number {
  if (distance >= radius) return 0;
  return (1 - Math.pow(distance / radius, PROFILE_EXPONENT)) * height;
}

export function craterDipAt(distance: number, radius: number, craterDepth: number): number {
  const bowl = radius * CRATER_BOWL;
  if (distance >= bowl) return 0;
  return craterDepth * (1 - distance / bowl);
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
