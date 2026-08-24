import { readPersistedFile, writePersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { worldSeedLibraryFromStoredJson, type StoredWorldSeedLibrary } from './storedWorldSeedLibrary';

const FILE_NAME = 'worldSeeds';

export function loadStoredWorldSeedLibrary(): StoredWorldSeedLibrary {
  return worldSeedLibraryFromStoredJson(readPersistedFile(FILE_NAME));
}

export function storeWorldSeedLibrary(library: StoredWorldSeedLibrary): void {
  writePersistedFile(FILE_NAME, library);
}
