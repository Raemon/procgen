interface PrismaLike {
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
  if (!databaseUrl) throw new Error(NO_DATABASE_URL);
  return connectedStore();
}

const NO_DATABASE_URL =
  'DATABASE_URL is not set. The database is the only store for worlds and assets, so the server cannot start without it. Point DATABASE_URL at a Postgres, run `npx prisma db push`, then `npm run docs:seed` to load the repo asset library into it.';

async function connectedStore(): Promise<Store> {
  const mod = (await import('@prisma/client')) as unknown as { PrismaClient: new () => PrismaLike };
  const prisma = new mod.PrismaClient();
  return { enabled: true, prisma, disconnect: () => prisma.$disconnect() };
}
