import type { ReadOnlyCreatureLibrary } from '../app/readOnlyLibraries';
import { MOONLIT_DWARF_ART } from './art/builtInBillboards';
import { isCharacter, type CreatureDef } from './creatureDef';

export const PLAYER_CHARACTER_ID = 8;

export function playerCharacterDef(library: ReadOnlyCreatureLibrary): CreatureDef | null {
  return (
    library.all().find((creature) => creature.billboardArt === MOONLIT_DWARF_ART) ??
    library.byId(PLAYER_CHARACTER_ID) ??
    library.all().find(isCharacter) ??
    null
  );
}
