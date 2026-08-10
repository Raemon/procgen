export const SEA_LEVEL = 0.45;

export function isAboveWater(elevation: number): boolean {
  return elevation > SEA_LEVEL;
}
