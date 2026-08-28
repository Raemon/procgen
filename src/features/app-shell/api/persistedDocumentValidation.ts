import type { UnparsedDocument } from '@/features/app-shell/persistence/persistedDocumentContents';
import type { PersistedDocumentName } from '@/features/app-shell/persistence/persistedDocuments';

const COLLECTION_DOCUMENTS = new Set<PersistedDocumentName>([
  'tiles',
  'pieces',
  'cultures',
  'creatures',
  'items',
]);

const LIBRARIES_SHIPPED_AS_ARRAYS = new Set<PersistedDocumentName>(['worldSeeds', 'templates']);

export function persistedDocumentIsValid<Name extends PersistedDocumentName>(
  name: Name,
  data: unknown,
): data is UnparsedDocument<Name> {
  if (COLLECTION_DOCUMENTS.has(name)) return Array.isArray(data);
  if (LIBRARIES_SHIPPED_AS_ARRAYS.has(name)) return Array.isArray(data) || isPlainObject(data);
  return isPlainObject(data);
}

function isPlainObject(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}
