import { readPersistedDocument, writePersistedDocument } from '@/features/app-shell/persistence/persistedDocumentStore';
import { savedWorldsFromStoredJson, type StoredSavedWorlds } from './storedSavedWorlds';

const FILE_NAME = 'savedWorlds';

export function loadStoredSavedWorlds(): StoredSavedWorlds {
  return savedWorldsFromStoredJson(readPersistedDocument(FILE_NAME));
}

export function storeSavedWorlds(saved: StoredSavedWorlds): void {
  writePersistedDocument(FILE_NAME, saved);
}
