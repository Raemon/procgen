import {
  PROFILE_BELL,
  PROFILE_CHOICES,
  PROFILE_RING,
  PROFILE_SAWTOOTH,
  PROFILE_STEPS,
  profileValueAt,
  type FieldProfile,
} from './fieldProfile';

const PROFILE_EXPONENT = 1.6;
const CRATER_BOWL = 0.18;

export const PROFILE_RIM = 6;

const RIM_CHOICE = {
  value: PROFILE_RIM,
  label: 'rim',
  help: 'A power cone — full strength at the centre, falling away a little faster than a straight line — with a bowl bitten out of the summit. One shape for a volcano with its crater, a shield with a caldera, an impact crater with its raised lip.',
} as const;

export const STAMP_PROFILE_CHOICES = [...PROFILE_CHOICES, RIM_CHOICE] as const;

export interface StampProfile {
  shape: number;
  levels: number;
  bands: number;
  rimDepth: number;
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

export function stampValueAt(
  distance: number,
  radius: number,
  weight: number,
  profile: StampProfile,
): number {
  if (radius <= 0 || distance >= radius) return 0;
  if (profile.shape === PROFILE_RIM) return rimValueAt(distance, radius, weight, profile.rimDepth);
  return weight * profileValueAt(distance / radius, radialProfileOf(profile));
}

function rimValueAt(
  distance: number,
  radius: number,
  height: number,
  rimDepth: number,
): number {
  const cone = coneProfileAt(distance, radius, height);
  if (cone <= 0) return cone;
  return cone - craterDipAt(distance, radius, rimDepth);
}

function radialProfileOf(profile: StampProfile): FieldProfile {
  const shape = profile.shape;
  if (shape === PROFILE_BELL) return { shape, center: 0, width: 2, levels: 0, invert: false };
  if (shape === PROFILE_RING) return { shape, center: 0, width: 1, levels: 0, invert: false };
  if (shape === PROFILE_SAWTOOTH) {
    return { shape, center: 0, width: 1 / Math.max(1, profile.bands), levels: 0, invert: true };
  }
  if (shape === PROFILE_STEPS) {
    return { shape, center: 0.5, width: 1, levels: profile.levels, invert: true };
  }
  return { shape, center: 0.5, width: 1, levels: 0, invert: true };
}
