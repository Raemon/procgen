import type { RandomStream } from '../../procgen/random/mulberry32';
import { hexFromHsl, wrappedHue } from './hexFromHsl';
import type { TileSlot } from './kitTileSlots';

const HUE_SPREAD = 0.1;
const LEAST_SATURATION = 0.05;
const SATURATION_SPREAD = 0.15;
const LIGHTNESS_JITTER = 0.06;

export function harmonizedTileColors(
  random: RandomStream,
  slots: readonly TileSlot[],
  hueBias: number,
): string[] {
  return slots.map((slot) => mutedColorAround(random, hueBias, slot.lightness));
}

function mutedColorAround(random: RandomStream, hueBias: number, lightness: number): string {
  return hexFromHsl(
    wrappedHue(hueBias + (random() - 0.5) * HUE_SPREAD),
    LEAST_SATURATION + random() * SATURATION_SPREAD,
    lightness + (random() - 0.5) * LIGHTNESS_JITTER,
  );
}
