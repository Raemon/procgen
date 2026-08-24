export const PERSISTED_DOCUMENT_NAMES = [
  'pipeline',
  'tiles',
  'templates',
  'worldSeeds',
  'pieces',
  'cultures',
  'creatures',
  'items',
  'uiState',
  'worldSeedThumbnails',
  'assetFolders',
] as const;

export type PersistedDocumentName = (typeof PERSISTED_DOCUMENT_NAMES)[number];

export const DEFAULTED_DOCUMENT_NAMES = [
  'pipeline',
  'templates',
  'worldSeeds',
  'uiState',
  'worldSeedThumbnails',
  'assetFolders',
] as const;

export type DefaultedDocumentName = (typeof DEFAULTED_DOCUMENT_NAMES)[number];

export type CollectionDocumentName = Exclude<PersistedDocumentName, DefaultedDocumentName>;
