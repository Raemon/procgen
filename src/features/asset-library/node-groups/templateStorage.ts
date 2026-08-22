import { readPersistedFile, writePersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { templateLibraryFromStoredJson, type StoredTemplateLibrary } from './storedTemplateLibrary';

const FILE_NAME = 'templates';

export function loadStoredTemplateLibrary(): StoredTemplateLibrary {
  return templateLibraryFromStoredJson(readPersistedFile(FILE_NAME));
}

export function storeTemplateLibrary(library: StoredTemplateLibrary): void {
  writePersistedFile(FILE_NAME, library);
}
