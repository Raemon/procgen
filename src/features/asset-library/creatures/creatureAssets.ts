import type { AssetOfKind } from '@/features/asset-library/asset';
import type { CreatureId } from '@/features/asset-library/asset';
import { AssetCollection } from '../collection/assetCollection';
import { newCharacterWithId, newCreatureWithId, type CreatureDef } from './creatureDef';
import { loadStoredCreatures, storeCreatures } from './creatureStorage';

export type CreaturePatch = Partial<Omit<CreatureDef, 'id'>>;

export class CreatureAssets extends AssetCollection<AssetOfKind<'creatures'>> {
  constructor(initialCreatures?: CreatureDef[]) {
    super(initialCreatures ?? loadStoredCreatures() ?? []);
  }

  addCharacter(): CreatureDef {
    return this.append(newCharacterWithId(this.claimId()));
  }

  protected blankAsset(id: CreatureId): CreatureDef {
    return newCreatureWithId(id);
  }

  protected store(creatures: readonly CreatureDef[]): void {
    storeCreatures(creatures);
  }
}
