import type { ReadOnlyCreatureAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { MOONLIT_DWARF_ART } from '../creatures/art/builtInBillboards';
import { isCharacter, type CreatureDef } from '../creatures/creatureDef';

export const PLAYER_CHARACTER_ID = 8;

export function playerCharacterDef(creatureAssets: ReadOnlyCreatureAssets): CreatureDef | null {
  return (
    creatureAssets.all().find((creature) => creature.billboardArt === MOONLIT_DWARF_ART) ??
    creatureAssets.byId(PLAYER_CHARACTER_ID) ??
    creatureAssets.all().find(isCharacter) ??
    null
  );
}
