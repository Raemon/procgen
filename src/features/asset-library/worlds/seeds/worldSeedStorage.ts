import { readPersistedDocument, writePersistedDocument } from '@/features/app-shell/persistence/persistedDocumentStore';
import { worldSeedLibraryFromStoredJson, type StoredWorldSeedLibrary } from './storedWorldSeedLibrary';

const FILE_NAME = 'worldSeeds';

export function loadStoredWorldSeedLibrary(): StoredWorldSeedLibrary {
  return worldSeedLibraryFromStoredJson(readPersistedDocument(FILE_NAME));
}

export function storeWorldSeedLibrary(library: StoredWorldSeedLibrary): void {
  writePersistedDocument(FILE_NAME, library);
}
