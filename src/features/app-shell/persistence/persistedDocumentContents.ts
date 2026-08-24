import type { PersistedDocumentName } from './persistedDocuments';
import type { StoredAssetFolders } from '@/features/asset-library/folders/assetFolder';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { ItemDef } from '@/features/asset-library/items/itemDef';
import type { StoredTemplateLibrary } from '@/features/asset-library/node-groups/storedTemplateLibrary';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import type { StoredArtOf } from '@/features/asset-library/tiles/storage/storedFaceArt';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import type { StoredWorldSeedLibrary } from '@/features/asset-library/worlds/seeds/storedWorldSeedLibrary';
import type { StoredSavedWorlds } from '@/features/asset-library/worlds/saved/storedSavedWorlds';

export type WorldSeedKey = string;
export type ThumbnailDataUrl = string;
export type PersistedUiKey = string;

export type WorldSeedThumbnailIndex = Record<WorldSeedKey, ThumbnailDataUrl>;
export type PersistedUiState = Record<PersistedUiKey, unknown>;

export interface StoredDocumentContents {
  pipeline: PipelineState;
  tiles: StoredArtOf<TileDef>[];
  templates: StoredTemplateLibrary;
  worldSeeds: StoredWorldSeedLibrary;
  savedWorlds: StoredSavedWorlds;
  pieces: readonly Piece[];
  cultures: readonly Culture[];
  creatures: StoredArtOf<CreatureDef>[];
  items: StoredArtOf<ItemDef>[];
  uiState: PersistedUiState;
  worldSeedThumbnails: WorldSeedThumbnailIndex;
  assetFolders: StoredAssetFolders;
}

export interface ParsedDocumentContents {
  pipeline: PipelineState;
  tiles: TileDef[];
  templates: StoredTemplateLibrary;
  worldSeeds: StoredWorldSeedLibrary;
  savedWorlds: StoredSavedWorlds;
  pieces: Piece[];
  cultures: Culture[];
  creatures: CreatureDef[];
  items: ItemDef[];
  uiState: PersistedUiState;
  worldSeedThumbnails: WorldSeedThumbnailIndex;
  assetFolders: StoredAssetFolders;
}

export type StoredDocument<Name extends PersistedDocumentName> = StoredDocumentContents[Name];
export type ParsedDocument<Name extends PersistedDocumentName> = ParsedDocumentContents[Name];

declare const unreadJson: unique symbol;

export type UnparsedDocument<Name extends PersistedDocumentName> = {
  readonly [unreadJson]: Name;
};

export function unparsedDocument<Name extends PersistedDocumentName>(
  json: unknown,
): UnparsedDocument<Name> {
  return json as UnparsedDocument<Name>;
}

export function jsonOf<Name extends PersistedDocumentName>(
  document: UnparsedDocument<Name>,
): unknown {
  return document as unknown;
}
