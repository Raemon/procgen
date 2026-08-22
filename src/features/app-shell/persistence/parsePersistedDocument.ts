import { creaturesFromStoredJson } from '@/features/asset-library/creatures/creatureStorage';
import { culturesFromStoredJson } from '@/features/asset-library/cultures/cultureStorage';
import { itemsFromStoredJson } from '@/features/asset-library/items/itemStorage';
import { sanitizeTemplates } from '@/features/asset-library/node-groups/nodeTemplate';
import { piecesFromStoredJson } from '@/features/asset-library/pieces/pieceStorage';
import { tilesFromStoredJson } from '@/features/asset-library/tiles/tileStorage';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { worldLibraryFromStoredJson } from '@/features/asset-library/worlds/presets/storedWorldLibrary';
import { worldThumbnailIndexFrom } from '@/features/asset-library/worldThumbnailIndex';
import { persistedUiStateFrom } from '../state/persistedUiState';
import { jsonOf, type ParsedDocument, type UnparsedDocument } from './persistedDocumentContents';
import type {
  CollectionDocumentName,
  DefaultedDocumentName,
  PersistedDocumentName,
} from './persistedDocuments';

type DocumentParser<Name extends PersistedDocumentName> = (
  json: unknown,
) => ParsedDocument<Name> | null;

type DocumentParsers = { [Name in PersistedDocumentName]: DocumentParser<Name> };

const PARSERS: DocumentParsers = {
  pipeline: sanitizePipeline,
  tiles: tilesFromStoredJson,
  templates: sanitizeTemplates,
  worldPresets: worldLibraryFromStoredJson,
  pieces: piecesFromStoredJson,
  cultures: culturesFromStoredJson,
  creatures: creaturesFromStoredJson,
  items: itemsFromStoredJson,
  uiState: persistedUiStateFrom,
  worldThumbnails: worldThumbnailIndexFrom,
};

export function parseStoredCollection<Name extends CollectionDocumentName>(
  name: Name,
  document: UnparsedDocument<Name> | null,
): ParsedDocument<Name> | null {
  return parseWith(name, document);
}

export function parseDefaultedDocument<Name extends DefaultedDocumentName>(
  name: Name,
  document: UnparsedDocument<Name> | null,
): ParsedDocument<Name> {
  return parseWith(name, document) as ParsedDocument<Name>;
}

function parseWith<Name extends PersistedDocumentName>(
  name: Name,
  document: UnparsedDocument<Name> | null,
): ParsedDocument<Name> | null {
  const parse = PARSERS[name] as DocumentParser<Name>;
  return parse(document === null ? null : jsonOf(document));
}
