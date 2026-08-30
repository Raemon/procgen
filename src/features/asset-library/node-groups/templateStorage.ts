import { readPersistedDocument, writePersistedDocument } from '@/features/app-shell/persistence/persistedDocumentStore';
import { templateLibraryFromStoredJson, type StoredTemplateLibrary } from './storedTemplateLibrary';

const FILE_NAME = 'templates';

export function loadStoredTemplateLibrary(): StoredTemplateLibrary {
  return templateLibraryFromStoredJson(readPersistedDocument(FILE_NAME));
}

export function storeTemplateLibrary(library: StoredTemplateLibrary): void {
  writePersistedDocument(FILE_NAME, library);
}
