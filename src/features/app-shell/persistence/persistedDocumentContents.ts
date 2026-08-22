import type { PersistedDocumentName } from './persistedDocuments';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { ItemDef } from '@/features/asset-library/items/itemDef';
import type { NodeTemplate } from '@/features/asset-library/node-groups/nodeTemplate';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import type { StoredArtOf } from '@/features/asset-library/tiles/storage/storedFaceArt';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import type { StoredWorldLibrary } from '@/features/asset-library/worlds/presets/storedWorldLibrary';

export type WorldKey = string;
export type ThumbnailDataUrl = string;
export type PersistedUiKey = string;

export type WorldThumbnailIndex = Record<WorldKey, ThumbnailDataUrl>;
export type PersistedUiState = Record<PersistedUiKey, unknown>;

export interface StoredDocumentContents {
  pipeline: PipelineState;
  tiles: StoredArtOf<TileDef>[];
  templates: readonly NodeTemplate[];
  worldPresets: StoredWorldLibrary;
  pieces: readonly Piece[];
  cultures: readonly Culture[];
  creatures: StoredArtOf<CreatureDef>[];
  items: StoredArtOf<ItemDef>[];
  uiState: PersistedUiState;
  worldThumbnails: WorldThumbnailIndex;
}

export interface ParsedDocumentContents {
  pipeline: PipelineState;
  tiles: TileDef[];
  templates: NodeTemplate[];
  worldPresets: StoredWorldLibrary;
  pieces: Piece[];
  cultures: Culture[];
  creatures: CreatureDef[];
  items: ItemDef[];
  uiState: PersistedUiState;
  worldThumbnails: WorldThumbnailIndex;
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
