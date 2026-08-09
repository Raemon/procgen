import type { Store } from './db';

export const PERSISTED_DOC_NAMES = [
  'pipeline',
  'tiles',
  'templates',
  'worldPresets',
  'pieces',
  'cultures',
  'creatures',
  'items',
  'uiState',
];

const DOCS_WRITTEN_ONLY_BY_THE_APP = ['uiState'];

const DOC_NAMES_BEFORE_THE_ASSETS_RENAME: Record<string, string> = { tiles: 'tileset' };

export function isPersistedDocName(name: string): boolean {
  return PERSISTED_DOC_NAMES.includes(name);
}

export interface DocStore {
  read(name: string): unknown;
  stamp(): string;
  write(name: string, json: unknown): void;
}

export async function createDocStore(store: Store): Promise<DocStore> {
  const docs = await loadDocs(store);
  let version = 0;
  return {
    read: (name) => (docs.has(name) ? docs.get(name) : null),
    stamp: () => String(version),
    write(name, json) {
      docs.set(name, json);
      version += 1;
      void saveDoc(store, name, json);
    },
  };
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
