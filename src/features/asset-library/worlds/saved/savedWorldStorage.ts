import { readPersistedFile, writePersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { savedWorldsFromStoredJson, type StoredSavedWorlds } from './storedSavedWorlds';

const FILE_NAME = 'savedWorlds';

export function loadStoredSavedWorlds(): StoredSavedWorlds {
  return savedWorldsFromStoredJson(readPersistedFile(FILE_NAME));
}

export function storeSavedWorlds(saved: StoredSavedWorlds): void {
  writePersistedFile(FILE_NAME, saved);
}
