import type { CharacterBillboard } from '../../characters/characterBillboard';
import { dwarfBillboard } from '../../characters/dwarf/dwarfBillboard';
import { humanoidBillboard } from './humanoidBillboard';
import { BLANK_CHARACTER_PALETTE, WANDERING_TRADER_PALETTE } from './humanoidPalette';

export const MOONLIT_DWARF_ART = 'moonlit-dwarf';
export const WANDERING_TRADER_ART = 'wandering-trader';
export const BLANK_CHARACTER_ART = 'blank-character';

const BUILDERS: Readonly<Record<string, () => CharacterBillboard>> = {
  [MOONLIT_DWARF_ART]: () => dwarfBillboard(),
  [WANDERING_TRADER_ART]: () => humanoidBillboard(WANDERING_TRADER_PALETTE),
  [BLANK_CHARACTER_ART]: () => humanoidBillboard(BLANK_CHARACTER_PALETTE),
};

const alreadyBuilt = new Map<string, CharacterBillboard>();

export const BUILT_IN_BILLBOARD_ART = Object.keys(BUILDERS);

export function isBuiltInBillboardArt(value: unknown): value is string {
  return typeof value === 'string' && value in BUILDERS;
}

export function builtInBillboard(art: unknown): CharacterBillboard | null {
  if (!isBuiltInBillboardArt(art)) return null;
  const cached = alreadyBuilt.get(art);
  if (cached) return cached;
  const billboard = BUILDERS[art]!();
  alreadyBuilt.set(art, billboard);
  return billboard;
}
