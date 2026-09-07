import type { ReadOnlyCreatureAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { playerCharacterDef } from '@/features/asset-library/characters/playerCharacter';
import { DEFAULT_STRENGTH, DEFAULT_VIGOR } from '@/features/asset-library/creatures/creatureDef';
import { Fight } from './fight';

export function fightForThePlayer(creatures: ReadOnlyCreatureAssets): Fight {
  return new Fight({
    vigor: () => playerCharacterDef(creatures)?.vigor ?? DEFAULT_VIGOR,
    strength: () => playerCharacterDef(creatures)?.strength ?? DEFAULT_STRENGTH,
  });
}
