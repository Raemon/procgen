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
  'items',
];

export function isPersistedDocName(name: string): boolean {
  return PERSISTED_DOC_NAMES.includes(name);
}

export interface DocStore {
  read(name: string): unknown;
  stamp(): string;
  write(name: string, json: unknown): void;
}

export async function createDocStore(store: Store, root: string): Promise<DocStore> {
  const docs = await loadDocs(store, root);
  let version = 0;
  return {
    read: (name) => (docs.has(name) ? docs.get(name) : null),
    stamp: () => String(version),
    write(name, json) {
      docs.set(name, json);
      version += 1;
      if (store.enabled) void saveDoc(store, name, json);
      else writeSeedFile(root, name, json);
    },
  };
}

async function loadDocs(store: Store, root: string): Promise<Map<string, unknown>> {
  const docs = new Map<string, unknown>();
  const fromDb = await readAllDocs(store);
  for (const name of PERSISTED_DOC_NAMES) {
    const stored = fromDb.get(name);
    if (stored !== undefined) {
      docs.set(name, stored);
      continue;
    }
    const seed = readSeedFile(root, name);
    if (seed === undefined) continue;
    docs.set(name, seed);
    if (store.enabled) {
      await saveDoc(store, name, seed);
      console.log(`[db] Seeded doc '${name}' from data file.`);
    }
  }
  return docs;
}

async function readAllDocs(store: Store): Promise<Map<string, unknown>> {
  if (!store.enabled || !store.prisma) return new Map();
  const rows = await store.prisma.doc.findMany();
  return new Map(rows.map((row) => [row.name, row.json]));
}

export async function saveDoc(store: Store, name: string, json: unknown): Promise<void> {
  if (!store.enabled || !store.prisma) return;
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

export function docFilePath(root: string, name: string): string {
  return join(root, 'data', `${name}.json`);
}

function readSeedFile(root: string, name: string): unknown {
  const path = docFilePath(root, name);
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.warn(`[db] Could not seed doc '${name}' — data file is not valid JSON.`);
    return undefined;
  }
}

function writeSeedFile(root: string, name: string, json: unknown): void {
  mkdirSync(join(root, 'data'), { recursive: true });
  const path = docFilePath(root, name);
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
}

