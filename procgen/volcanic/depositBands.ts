const DEPOSIT_ORE = 0;
const DEPOSIT_OBSIDIAN = 1;
const DEPOSIT_SULFUR = 2;

const OBSIDIAN_BAND = 0.35;
const SULFUR_BAND = 0.75;

export function depositKindAt(distance: number, hostRadius: number): number {
  const reach = distance / Math.max(1, hostRadius);
  if (reach <= OBSIDIAN_BAND) return DEPOSIT_OBSIDIAN;
  if (reach <= SULFUR_BAND) return DEPOSIT_SULFUR;
  return DEPOSIT_ORE;
}
