import { readPersistedFile, writePersistedFile } from './repoFileStore';
import { sanitizeTemplates, type NodeTemplate } from '../../procgen/templates/nodeTemplate';
import type { PersistedCollection } from '../../procgen/persistence/persistedCollection';

const FILE_NAME = 'templates';

export function persistedTemplates(): PersistedCollection<NodeTemplate> {
  return {
    load: () => sanitizeTemplates(readPersistedFile(FILE_NAME)),
    store: (templates) => writePersistedFile(FILE_NAME, templates),
  };
}
