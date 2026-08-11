import { readPersistedFile, writePersistedFile } from '../../frontend/persistence/repoFileStore';
import { sanitizeTemplates, type NodeTemplate } from './nodeTemplate';

const FILE_NAME = 'templates';

export function loadSavedTemplates(): NodeTemplate[] {
  return sanitizeTemplates(readPersistedFile(FILE_NAME));
}

export function storeSavedTemplates(templates: readonly NodeTemplate[]): void {
  writePersistedFile(FILE_NAME, templates);
}
