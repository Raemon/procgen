import type { ReadOnlyCreatureAssets } from '../../frontend/readOnlyAssets';
import { MOONLIT_DWARF_ART } from '../creatures/art/builtInBillboards';
import { isCharacter, type CreatureDef } from '../creatures/creatureDef';

export const PLAYER_CHARACTER_ID = 8;

export function playerCharacterDef(library: ReadOnlyCreatureAssets): CreatureDef | null {
  return (
    library.all().find((creature) => creature.billboardArt === MOONLIT_DWARF_ART) ??
    library.byId(PLAYER_CHARACTER_ID) ??
    library.all().find(isCharacter) ??
    null
  );
}
