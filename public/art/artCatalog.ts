import type { CharacterBillboard } from '@/features/asset-library/characters/characterBillboard';
import {
  BLANK_CHARACTER_ART,
  GAUNT_ONE_ART,
  MOONLIT_DWARF_ART,
  WANDERING_TRADER_ART,
} from '@/features/asset-library/characters/billboardArtNames';
import { dwarfBillboard } from './dwarf/dwarfBillboard';
import { gauntOneBillboard } from './gauntOne/gauntOneBillboard';
import { humanoidBillboard } from './humanoid/humanoidBillboard';
import { BLANK_CHARACTER_PALETTE, WANDERING_TRADER_PALETTE } from './humanoid/humanoidPalette';

const BUILDERS: Readonly<Record<string, () => CharacterBillboard>> = {
  [MOONLIT_DWARF_ART]: () => dwarfBillboard(),
  [WANDERING_TRADER_ART]: () => humanoidBillboard(WANDERING_TRADER_PALETTE),
  [BLANK_CHARACTER_ART]: () => humanoidBillboard(BLANK_CHARACTER_PALETTE),
  [GAUNT_ONE_ART]: () => gauntOneBillboard(),
};

export function paintedArtNamed(art: string): CharacterBillboard | null {
  const builder = BUILDERS[art];
  return builder ? builder() : null;
}
