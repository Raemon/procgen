export const PERSISTED_DOCUMENT_NAMES = [
  'pipeline',
  'tiles',
  'templates',
  'worldPresets',
  'pieces',
  'cultures',
  'creatures',
  'items',
  'uiState',
  'worldThumbnails',
] as const;

export type PersistedDocumentName = (typeof PERSISTED_DOCUMENT_NAMES)[number];
