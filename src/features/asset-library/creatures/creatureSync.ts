import { creaturesAsStoredJson, creaturesFromStoredJson } from './creatureStorage';
import type { CreatureDef } from './creatureDef';
import type { StoredArtOf } from '../tiles/storage/storedFaceArt';

export interface CreatureSync {
  stored: StoredArtOf<CreatureDef>[];
  added: number;
}

export function syncMissingCreatures(held: unknown, shipped: unknown): CreatureSync {
  const kept = creaturesFromStoredJson(held) ?? [];
  const missing = creaturesTheLibraryLacks(kept, creaturesFromStoredJson(shipped) ?? []);
  return { stored: creaturesAsStoredJson([...kept, ...missing]), added: missing.length };
}

function creaturesTheLibraryLacks(
  held: readonly CreatureDef[],
  shipped: readonly CreatureDef[],
): CreatureDef[] {
  const have = new Set(held.map((creature) => creature.id));
  return shipped.filter((creature) => !have.has(creature.id));
}
