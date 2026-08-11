import type { PersistedDocumentName } from '@/features/app-shell/persistence/persistedDocuments';

const COLLECTION_DOCUMENTS = new Set<PersistedDocumentName>([
  'tiles',
  'templates',
  'worldPresets',
  'pieces',
  'cultures',
  'creatures',
  'items',
]);

export function persistedDocumentIsValid(name: PersistedDocumentName, data: unknown): boolean {
  if (COLLECTION_DOCUMENTS.has(name)) return Array.isArray(data);
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}
