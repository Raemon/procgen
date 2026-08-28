import { clampUnit, mixPacked, packHex } from '@/features/asset-library/tiles/art/packedHex';

export interface SurfaceInk {
  base: string;
  shadow: string;
  rim: string;
}

export interface SculptLighting {
  keyAcross: number;
  keyAlong: number;
  fill: number;
  rimStrength: number;
  underglow: string;
}

interface PackedInk {
  base: number;
  shadow: number;
  rim: number;
}

const packedInks = new WeakMap<SurfaceInk, PackedInk>();

export function sculptedInk(
  ink: SurfaceInk,
  lighting: SculptLighting,
  across: number,
  along: number,
  underglow = 0,
): number {
  const packed = packedInkOf(ink);
  const lit = mixPacked(packed.shadow, packed.base, litAmount(lighting, across, along));
  const rimmed = mixPacked(lit, packed.rim, rimAmount(lighting, across, along));
  if (underglow <= 0) return rimmed;
  return mixPacked(rimmed, packHex(lighting.underglow), underglowAmount(underglow, along));
}

function packedInkOf(ink: SurfaceInk): PackedInk {
  const cached = packedInks.get(ink);
  if (cached) return cached;
  const packed = { base: packHex(ink.base), shadow: packHex(ink.shadow), rim: packHex(ink.rim) };
  packedInks.set(ink, packed);
  return packed;
}

function litAmount(lighting: SculptLighting, across: number, along: number): number {
  const key = -(across * lighting.keyAcross + along * lighting.keyAlong);
  return lighting.fill + (1 - lighting.fill) * clampUnit(key * 0.5 + 0.5);
}

function rimAmount(lighting: SculptLighting, across: number, along: number): number {
  const edge = clampUnit((across - 0.42) / 0.58);
  const height = clampUnit(0.75 - along * 0.45);
  return edge * edge * height * lighting.rimStrength;
}

function underglowAmount(strength: number, along: number): number {
  return clampUnit(strength * clampUnit(along * 0.6 + 0.5));
}
