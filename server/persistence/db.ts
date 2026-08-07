export interface PrismaLike {
  doc: {
    findMany(args?: unknown): Promise<Array<{ name: string; json: unknown }>>;
    upsert(args: unknown): Promise<unknown>;
  };
  character: {
    findUnique(args: unknown): Promise<Record<string, unknown> | null>;
    upsert(args: unknown): Promise<unknown>;
  };
  $disconnect(): Promise<void>;
}

export interface Store {
  readonly enabled: boolean;
  prisma?: PrismaLike;
  disconnect(): Promise<void>;
}

export async function initStore(databaseUrl: string | null): Promise<Store> {
  if (!databaseUrl) {
    console.log('[db] DATABASE_URL not set — running in-memory (no persistence).');
    return memoryStore();
  }
  return connectedStore();
}

function memoryStore(): Store {
  return { enabled: false, disconnect: async () => {} };
}

async function connectedStore(): Promise<Store> {
  try {
    const mod = (await import('@prisma/client')) as unknown as { PrismaClient: new () => PrismaLike };
    const prisma = new mod.PrismaClient();
    return { enabled: true, prisma, disconnect: () => prisma.$disconnect() };
  } catch (err) {
    console.warn('[db] Failed to load @prisma/client; falling back to in-memory.', err);
    return memoryStore();
  }
}
