import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Store } from './db';

export const PERSISTED_DOC_NAMES = [
  'pipeline',
  'tileset',
  'templates',
  'worldPresets',
  'prefabs',
  'creatures',
];

export function isPersistedDocName(name: string): boolean {
  return PERSISTED_DOC_NAMES.includes(name);
}

export function docFilePath(root: string, name: string): string {
  return join(root, 'data', `${name}.json`);
}

export function readDocFile(root: string, name: string): string | null {
  const path = docFilePath(root, name);
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

export function writeDocFile(root: string, name: string, json: unknown): void {
  mkdirSync(join(root, 'data'), { recursive: true });
  writeFileSync(docFilePath(root, name), JSON.stringify(json, null, 2) + '\n');
}

export async function saveDoc(store: Store, name: string, json: unknown): Promise<void> {
  if (!store.enabled || !store.prisma) return;
  await store.prisma.doc.upsert({
    where: { name },
    create: { name, json },
    update: { json },
  });
}

export async function materializeDocsFromDb(store: Store, root: string): Promise<void> {
  if (!store.enabled || !store.prisma) return;
  const rows = await store.prisma.doc.findMany();
  const byName = new Map(rows.map((row) => [row.name, row.json]));
  for (const name of PERSISTED_DOC_NAMES) await syncOneDoc(store, root, name, byName.get(name));
}

async function syncOneDoc(store: Store, root: string, name: string, dbJson: unknown): Promise<void> {
  if (dbJson !== undefined) {
    writeDocFile(root, name, dbJson);
    return;
  }
  const fileJson = readDocFile(root, name);
  if (fileJson !== null) await seedDocFromFile(store, name, fileJson);
}

async function seedDocFromFile(store: Store, name: string, fileJson: string): Promise<void> {
  try {
    await saveDoc(store, name, JSON.parse(fileJson));
    console.log(`[db] Seeded doc '${name}' from data file.`);
  } catch {
    console.warn(`[db] Could not seed doc '${name}' — data file is not valid JSON.`);
  }
}
