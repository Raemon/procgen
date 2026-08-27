export const PROFILE_RAMP = 0;
export const PROFILE_BELL = 1;
export const PROFILE_RING = 2;
export const PROFILE_SAWTOOTH = 3;
export const PROFILE_STEPS = 4;
export const PROFILE_PLATEAU = 5;

export const PROFILE_CHOICES = [
  {
    value: PROFILE_RAMP,
    label: 'ramp',
    help: 'A straight rise from 0 half a width below the centre to 1 half a width above it, flat outside. The plain fade.',
  },
  {
    value: PROFILE_BELL,
    label: 'bell',
    help: 'A smooth hump peaking at the centre and back to 0 half a width out on either side. Domes, shoals, one soft blob.',
  },
  {
    value: PROFILE_RING,
    label: 'ring',
    help: 'Zero at the centre, peaking half a width out on both sides, back to 0 a full width out. Crater rims, reef rings, ridges that straddle a contour.',
  },
  {
    value: PROFILE_SAWTOOTH,
    label: 'sawtooth',
    help: 'The ramp repeated every width: 0 to 1, snap back, again. Strata, dune trains, tide lines.',
  },
  {
    value: PROFILE_STEPS,
    label: 'steps',
    help: 'The ramp snapped to a few flat levels, so the fade becomes a stair.',
  },
] as const;

export const PLATEAU_CHOICE = {
  value: PROFILE_PLATEAU,
  label: 'plateau',
  help: 'A flat top that reaches full strength within the floor half width of the contour, then falls away across the wall width. The one profile measured in tiles.',
} as const;

export interface FieldProfile {
  shape: number;
  center: number;
  width: number;
  levels: number;
  invert: boolean;
}

export interface PlateauProfile {
  center: number;
  tilesPerUnit: number;
  floorHalfWidth: number;
  wallWidth: number;
  wallCurve: number;
  invert: boolean;
}

export function profileValueAt(value: number, profile: FieldProfile): number {
  return orientated(shapedValue(value, profile), profile.invert);
}

export function plateauValueAt(value: number, profile: PlateauProfile): number {
  const tilesFromCentre = Math.abs(value - profile.center) * profile.tilesPerUnit;
  const intoWall = (tilesFromCentre - profile.floorHalfWidth) / Math.max(1e-6, profile.wallWidth);
  const climbed = Math.pow(clampToUnit(intoWall), profile.wallCurve);
  return orientated(1 - climbed, profile.invert);
}

function orientated(shaped: number, invert: boolean): number {
  return invert ? 1 - shaped : shaped;
}

function shapedValue(value: number, profile: FieldProfile): number {
  const width = Math.max(1e-6, profile.width);
  const offset = (value - profile.center) / width;
  if (profile.shape === PROFILE_BELL) return smoothstep(clampToUnit(1 - Math.abs(offset) * 2));
  if (profile.shape === PROFILE_RING) return smoothstep(clampToUnit(1 - Math.abs(Math.abs(offset) * 2 - 1)));
  if (profile.shape === PROFILE_SAWTOOTH) return offset - Math.floor(offset);
  if (profile.shape === PROFILE_STEPS) return steppedRamp(offset, profile.levels);
  return clampToUnit(offset + 0.5);
}

function steppedRamp(offset: number, levels: number): number {
  const steps = Math.max(2, Math.round(levels)) - 1;
  return Math.round(clampToUnit(offset + 0.5) * steps) / steps;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function clampToUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}
