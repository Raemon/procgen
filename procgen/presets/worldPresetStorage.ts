import { readPersistedFile, writePersistedFile } from '../../frontend/persistence/repoFileStore';
import { worldLibraryFromStoredJson, type StoredWorldLibrary } from './storedWorldLibrary';

const FILE_NAME = 'worldPresets';

export function loadStoredWorldLibrary(): StoredWorldLibrary {
  return worldLibraryFromStoredJson(readPersistedFile(FILE_NAME));
}

export function storeWorldLibrary(library: StoredWorldLibrary): void {
  writePersistedFile(FILE_NAME, library);
}
