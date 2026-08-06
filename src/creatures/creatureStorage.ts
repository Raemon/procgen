import { readPersistedFile, writePersistedFile } from '../persistence/repoFileStore';
import { upgradeStoredFaceArt } from '../world/tiles/legacyFaceArt';
import type { CreatureDef } from './creatureDef';

const FILE_NAME = 'creatures';

export function loadStoredCreatures(): CreatureDef[] | null {
  const parsed = readPersistedFile<unknown>(FILE_NAME);
  if (!Array.isArray(parsed)) return null;
  const creatures = parsed.filter(isCreatureDef).map(withValidatedFaceArt);
  return creatures.length > 0 ? creatures : null;
}

export function storeCreatures(creatures: readonly CreatureDef[]): void {
  writePersistedFile(FILE_NAME, creatures);
}

function withValidatedFaceArt(creature: CreatureDef): CreatureDef {
  return { ...creature, faceArt: upgradeStoredFaceArt(creature.faceArt) };
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
