import { sanitizeInventory } from '../items/inventory/sanitizeInventory';
import { readPersistedFile, writePersistedFile } from '../persistence/repoFileStore';
import { upgradeStoredFaceArt } from '../world/tiles/legacyFaceArt';
import { builtInBillboard, isBuiltInBillboardArt } from './art/builtInBillboards';
import { sanitizeCharacterBillboard } from './character/sanitizeCharacterBillboard';
import type { CreatureDef } from './creatureDef';
import { CREATURE, isEntityKind } from './entityKinds';

const FILE_NAME = 'creatures';

export function loadStoredCreatures(): CreatureDef[] | null {
  return creaturesFromStoredJson(readPersistedFile<unknown>(FILE_NAME));
}

export function creaturesFromStoredJson(parsed: unknown): CreatureDef[] | null {
  if (!Array.isArray(parsed)) return null;
  const creatures = parsed.filter(isCreatureDef).map(withValidatedArt);
  return creatures.length > 0 ? creatures : null;
}

export function storeCreatures(creatures: readonly CreatureDef[]): void {
  writePersistedFile(FILE_NAME, creaturesAsStoredJson(creatures));
}

export function creaturesAsStoredJson(creatures: readonly CreatureDef[]): CreatureDef[] {
  return creatures.map(withoutGeneratedFrames);
}

function withoutGeneratedFrames(creature: CreatureDef): CreatureDef {
  if (!isBuiltInBillboardArt(creature.billboardArt)) return creature;
  return { ...creature, billboard: null };
}

function withValidatedArt(creature: CreatureDef): CreatureDef {
  const billboardArt = isBuiltInBillboardArt(creature.billboardArt) ? creature.billboardArt : null;
  return {
    ...creature,
    faceArt: upgradeStoredFaceArt(creature.faceArt),
    kind: isEntityKind(creature.kind) ? creature.kind : CREATURE,
    inventory: sanitizeInventory(creature.inventory),
    billboardArt,
    billboard: billboardArt
      ? builtInBillboard(billboardArt)
      : sanitizeCharacterBillboard(creature.billboard),
  };
}

function isCreatureDef(value: unknown): value is CreatureDef {
  if (typeof value !== 'object' || value === null) return false;
  const creature = value as Partial<CreatureDef>;
  return (
    typeof creature.id === 'number' &&
    typeof creature.name === 'string' &&
    typeof creature.symbol === 'string' &&
    typeof creature.color === 'string' &&
    typeof creature.behavior === 'number' &&
    typeof creature.speed === 'number'
  );
}
