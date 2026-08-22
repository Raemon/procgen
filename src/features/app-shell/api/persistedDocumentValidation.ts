import type { UnparsedDocument } from '@/features/app-shell/persistence/persistedDocumentContents';
import type { PersistedDocumentName } from '@/features/app-shell/persistence/persistedDocuments';

const COLLECTION_DOCUMENTS = new Set<PersistedDocumentName>([
  'tiles',
  'templates',
  'pieces',
  'cultures',
  'creatures',
  'items',
]);

const WORLD_LIBRARY_DOCUMENT: PersistedDocumentName = 'worldPresets';

export function persistedDocumentIsValid<Name extends PersistedDocumentName>(
  name: Name,
  data: unknown,
): data is UnparsedDocument<Name> {
  if (COLLECTION_DOCUMENTS.has(name)) return Array.isArray(data);
  if (name === WORLD_LIBRARY_DOCUMENT) return Array.isArray(data) || isWorldLibraryEnvelope(data);
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

function isWorldLibraryEnvelope(data: unknown): boolean {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  return Array.isArray((data as { presets?: unknown }).presets);
}
