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
  if (!databaseUrl) throw new Error(NO_DATABASE_URL);
  return connectedStore();
}

const NO_DATABASE_URL =
  'DATABASE_URL is not set. The database is where the app keeps worlds and assets you edit, so the server cannot start without it. Point DATABASE_URL at a Postgres and run `npx prisma db push`; the assets the app ships install themselves on the next boot.';

async function connectedStore(): Promise<Store> {
  const mod = (await import('@prisma/client')) as unknown as { PrismaClient: new () => PrismaLike };
  const prisma = new mod.PrismaClient();
  return { enabled: true, prisma, disconnect: () => prisma.$disconnect() };
}
