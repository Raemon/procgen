import { existsSync, readFileSync } from 'node:fs';
import type { Store } from './db';
import {
  PERSISTED_DOCUMENT_NAMES,
  type PersistedDocumentName,
} from '@/features/app-shell/persistence/persistedDocuments';
import {
  unparsedDocument,
  type StoredDocument,
  type UnparsedDocument,
} from '@/features/app-shell/persistence/persistedDocumentContents';
import {
  libraryDocsFrom,
  syncMissingWorldSeeds,
} from '@/features/asset-library/worlds/seeds/worldSeedSync';
import { sanitizeWorldSeeds } from '@/features/asset-library/worlds/seeds/worldSeed';
import { assetFoldersFromStoredJson } from '@/features/asset-library/folders/assetFolder';
import { syncMissingAssetFolders } from '@/features/asset-library/folders/folderSync';

export const PERSISTED_DOC_NAMES = PERSISTED_DOCUMENT_NAMES;

const DOCS_WRITTEN_ONLY_BY_THE_APP = ['uiState', 'worldSeedThumbnails', 'savedWorlds'];
const PERSISTED_DOCUMENT_NAME_SET = new Set<string>(PERSISTED_DOCUMENT_NAMES);

const DOC_NAMES_BEFORE_THE_ASSETS_RENAME: Record<string, string> = {
  tiles: 'tileset',
  worldSeeds: 'worldPresets',
  worldSeedThumbnails: 'worldThumbnails',
};

export function isPersistedDocName(name: string): name is PersistedDocumentName {
  return PERSISTED_DOCUMENT_NAME_SET.has(name);
}

export type DocumentRevision = string;
export type LibraryStamp = string;

export interface DocStore {
  read<Name extends PersistedDocumentName>(name: Name): UnparsedDocument<Name> | null;
  revision(name: PersistedDocumentName): DocumentRevision;
  stamp(): LibraryStamp;
  write<Name extends PersistedDocumentName>(name: Name, json: StoredDocument<Name>): void;
  writeIfCurrent<Name extends PersistedDocumentName>(
    name: Name,
    revision: DocumentRevision,
    json: UnparsedDocument<Name>,
  ): DocumentRevision | null;
}

export async function createDocStore(store: Store): Promise<DocStore> {
  const docs = await loadDocs(store);
  const revisions = new Map<string, number>();
  let version = 0;
  return {
    read: (name) => (docs.has(name) ? unparsedDocument(docs.get(name)) : null),
    revision: (name) => String(revisions.get(name) ?? 0),
    stamp: () => String(version),
    write(name, json) {
      saveCurrent(name, json);
    },
    writeIfCurrent(name, revision, json) {
      if (revision !== String(revisions.get(name) ?? 0)) return null;
      saveCurrent(name, json);
      return String(revisions.get(name));
    },
  };

  function saveCurrent(name: string, json: unknown): void {
    docs.set(name, json);
    revisions.set(name, (revisions.get(name) ?? 0) + 1);
    version += 1;
    void saveDoc(store, name, json);
  }
}

async function loadDocs(store: Store): Promise<Map<string, unknown>> {
  const docs = new Map<string, unknown>();
  const fromDb = await readAllDocs(store);
  for (const name of PERSISTED_DOC_NAMES) {
    const stored = fromDb.get(name) ?? fromDb.get(DOC_NAMES_BEFORE_THE_ASSETS_RENAME[name] ?? name);
    if (stored !== undefined) docs.set(name, stored);
  }
  reportDocsTheDatabaseIsMissing(docs);
  installWorldSeedsShippedInDataFiles(docs, store);
  installAssetFoldersShippedInDataFiles(docs, store);
  return docs;
}

function installAssetFoldersShippedInDataFiles(docs: Map<string, unknown>, store: Store): void {
  const shipped = assetFoldersFromStoredJson(dataFileJson('assetFolders'));
  if (shipped.folders.length === 0) return;
  if (!docs.has('assetFolders')) {
    docs.set('assetFolders', shipped);
    void saveDoc(store, 'assetFolders', shipped);
    console.log(`[db] installed the ${shipped.folders.length} asset folders shipped in the repo data files`);
    return;
  }
  const held = assetFoldersFromStoredJson(docs.get('assetFolders'));
  const synced = syncMissingAssetFolders(held, shipped);
  if (synced.addedFolders + synced.addedPlacements === 0) return;
  docs.set('assetFolders', synced.stored);
  void saveDoc(store, 'assetFolders', synced.stored);
  console.log(
    `[db] installed ${synced.addedFolders} asset folders and filed ${synced.addedPlacements} assets shipped in the repo data files`,
  );
}

const LIBRARY_DOC_NAMES = ['tiles', 'pieces', 'cultures', 'worldSeeds'] as const;

function installWorldSeedsShippedInDataFiles(docs: Map<string, unknown>, store: Store): void {
  const touched = new Set<string>();
  for (const name of LIBRARY_DOC_NAMES) {
    if (docs.has(name)) continue;
    docs.set(name, dataFileJson(name) ?? []);
    touched.add(name);
  }
  const held = libraryDocsFrom((name) => docs.get(name));
  const shipped = libraryDocsFrom(dataFileJson).library;
  shipped.worldSeeds = sanitizeWorldSeeds(shipped.worldSeeds);
  const added = syncMissingWorldSeeds(held.library, shipped);
  if (added > 0) {
    docs.set('worldSeeds', held.worldSeedLibrary);
    for (const name of LIBRARY_DOC_NAMES) touched.add(name);
    console.log(`[db] installed ${added} world seeds shipped in the repo data files`);
  }
  for (const name of touched) void saveDoc(store, name, docs.get(name));
}

function dataFileJson(name: string): unknown {
  const path = `data/${name}.json`;
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return undefined;
  }
}

function reportDocsTheDatabaseIsMissing(docs: Map<string, unknown>): void {
  const missing = PERSISTED_DOC_NAMES.filter(
    (name) => !docs.has(name) && !DOCS_WRITTEN_ONLY_BY_THE_APP.includes(name),
  );
  if (missing.length === 0) return;
  console.warn(
    `[db] The database holds no ${missing.join(', ')}. Run \`npm run docs:seed\` to load the repo data files into it, or the world will come up without them.`,
  );
}

async function readAllDocs(store: Store): Promise<Map<string, unknown>> {
  if (!store.prisma) return new Map();
  const rows = await store.prisma.doc.findMany();
  return new Map(rows.map((row) => [row.name, row.json]));
}

export async function saveDoc(store: Store, name: string, json: unknown): Promise<void> {
  if (!store.prisma) return;
  try {
    await store.prisma.doc.upsert({
      where: { name },
      create: { name, json },
      update: { json },
    });
  } catch (err) {
    console.warn(`[persist] doc ${name} failed`, err);
  }
}
