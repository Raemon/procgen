import { sanitizeInventory } from '../items/inventory/sanitizeInventory';
import { inventoryAsStoredJson, type StoredInventory } from '../items/inventory/storedInventory';
import { readPersistedFile, writePersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import {
  defWithCompactFaceArt,
  faceArtFromStoredShape,
  type StoredArtOf,
} from '../tiles/storage/storedFaceArt';
import { builtInBillboard, isBuiltInBillboardArt } from './art/builtInBillboards';
import { sanitizeCharacterBillboard } from '../characters/sanitizeCharacterBillboard';
import {
  billboardAsStoredJson,
  type StoredCharacterBillboard,
} from '../characters/storedCharacterBillboard';
import { CHARACTER_BODY, CREATURE_BODY, type CreatureDef } from './creatureDef';
import { CHARACTER, CREATURE, isEntityKind } from './entityKinds';

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

export function creaturesAsStoredJson(creatures: readonly CreatureDef[]): StoredCreature[] {
  return creatures.map(withoutGeneratedFrames).map(creatureAsStoredJson);
}

export type StoredCreature = Omit<StoredArtOf<CreatureDef>, 'inventory' | 'billboard'> & {
  inventory: StoredInventory | null;
  billboard: StoredCharacterBillboard | null;
};

function creatureAsStoredJson(creature: CreatureDef): StoredCreature {
  return {
    ...defWithCompactFaceArt(creature),
    inventory: creature.inventory && inventoryAsStoredJson(creature.inventory),
    billboard: creature.billboard && billboardAsStoredJson(creature.billboard),
  };
}

function withoutGeneratedFrames(creature: CreatureDef): CreatureDef {
  if (!isBuiltInBillboardArt(creature.billboardArt)) return creature;
  return { ...creature, billboard: null };
}

function withValidatedArt(stored: CreatureDef): CreatureDef {
  const { size, ...creature } = stored as CreatureDef & { size?: unknown };
  const billboardArt = isBuiltInBillboardArt(creature.billboardArt) ? creature.billboardArt : null;
  const kind = isEntityKind(creature.kind) ? creature.kind : CREATURE;
  return {
    ...creature,
    ...bodySizeOfStoredCreature(creature, kind, size),
    faceArt: faceArtFromStoredShape(creature.faceArt),
    kind,
    inventory: sanitizeInventory(creature.inventory),
    billboardArt,
    billboard: billboardArt
      ? builtInBillboard(billboardArt)
      : sanitizeCharacterBillboard(creature.billboard),
  };
}

function bodySizeOfStoredCreature(
  creature: CreatureDef,
  kind: number,
  legacySize: unknown,
): { bodyWidth: number; bodyHeight: number } {
  const body = kind === CHARACTER ? CHARACTER_BODY : CREATURE_BODY;
  const legacyCube = kind === CHARACTER ? null : positiveNumber(legacySize);
  return {
    bodyWidth: positiveNumber(creature.bodyWidth) ?? legacyCube ?? body.width,
    bodyHeight: positiveNumber(creature.bodyHeight) ?? legacyCube ?? body.height,
  };
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && value > 0 ? value : null;
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
