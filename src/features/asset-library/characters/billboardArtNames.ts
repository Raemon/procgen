export const MOONLIT_DWARF_ART = 'moonlit-dwarf';
export const WANDERING_TRADER_ART = 'wandering-trader';
export const BLANK_CHARACTER_ART = 'blank-character';
export const GAUNT_ONE_ART = 'gaunt-one';

export const BILLBOARD_ART_NAMES: readonly string[] = [
  MOONLIT_DWARF_ART,
  WANDERING_TRADER_ART,
  BLANK_CHARACTER_ART,
  GAUNT_ONE_ART,
];

export function isBillboardArtName(value: unknown): value is string {
  return typeof value === 'string' && BILLBOARD_ART_NAMES.includes(value);
}
