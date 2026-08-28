import type { AssetOfKind } from '@/features/asset-library/asset';
import type { CreatureId } from '@/features/asset-library/asset';
import { AssetCollection } from '../collection/assetCollection';
import { BLANK_CHARACTER_ART } from '../characters/billboardArtNames';
import type { CharacterBillboard } from '../characters/characterBillboard';
import { newCharacterWithId, newCreatureWithId, type CreatureDef } from './creatureDef';
import { loadStoredCreatures, storeCreatures } from './creatureStorage';

export type CreaturePatch = Partial<Omit<CreatureDef, 'id'>>;

export class CreatureAssets extends AssetCollection<AssetOfKind<'creatures'>> {
  constructor(initialCreatures?: CreatureDef[]) {
    super(initialCreatures ?? loadStoredCreatures() ?? []);
  }

  addCharacter(): CreatureDef {
    const character = newCharacterWithId(this.claimId());
    return this.append({ ...character, billboard: this.artNamed(BLANK_CHARACTER_ART) });
  }

  artNamed(art: string): CharacterBillboard | null {
    return this.all().find((creature) => creature.billboardArt === art)?.billboard ?? null;
  }

  protected blankAsset(id: CreatureId): CreatureDef {
    return newCreatureWithId(id);
  }

  protected store(creatures: readonly CreatureDef[]): void {
    storeCreatures(creatures);
  }
}
