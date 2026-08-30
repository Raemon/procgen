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
  SHIPPED_COLLECTION_NAMES,
  withMissingShippedAssets,
} from '@/features/asset-library/shippedAssets';

export const PERSISTED_DOC_NAMES = PERSISTED_DOCUMENT_NAMES;

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
  installShippedAssets(docs, store);
  return docs;
}

function installShippedAssets(docs: Map<string, unknown>, store: Store): void {
  for (const name of SHIPPED_COLLECTION_NAMES) {
    const synced = withMissingShippedAssets(name, docs.get(name));
    if (synced.added === 0) continue;
    docs.set(name, synced.stored);
    void saveDoc(store, name, synced.stored);
    console.log(`[db] installed ${synced.added} ${name} the app ships that the database lacked`);
  }
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
