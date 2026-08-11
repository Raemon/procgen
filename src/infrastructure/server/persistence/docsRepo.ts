import type { Store } from './db';
import { PERSISTED_DOCUMENT_NAMES } from '@/features/app-shell/persistence/persistedDocuments';

export const PERSISTED_DOC_NAMES = PERSISTED_DOCUMENT_NAMES;

const DOCS_WRITTEN_ONLY_BY_THE_APP = ['uiState', 'worldThumbnails'];
const PERSISTED_DOCUMENT_NAME_SET = new Set<string>(PERSISTED_DOCUMENT_NAMES);

const DOC_NAMES_BEFORE_THE_ASSETS_RENAME: Record<string, string> = { tiles: 'tileset' };

export function isPersistedDocName(name: string): boolean {
  return PERSISTED_DOCUMENT_NAME_SET.has(name);
}

export interface DocStore {
  read(name: string): unknown;
  revision(name: string): string;
  stamp(): string;
  write(name: string, json: unknown): void;
  writeIfCurrent(name: string, revision: string, json: unknown): string | null;
}

export async function createDocStore(store: Store): Promise<DocStore> {
  const docs = await loadDocs(store);
  const revisions = new Map<string, number>();
  let version = 0;
  return {
    read: (name) => (docs.has(name) ? docs.get(name) : null),
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
  return docs;
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
