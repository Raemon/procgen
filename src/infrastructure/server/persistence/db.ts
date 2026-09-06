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
    console.warn(NO_DATABASE_URL);
    return memoryOnlyStore();
  }
  return connectedStore();
}

const NO_DATABASE_URL =
  '[db] DATABASE_URL is not set, so worlds and assets you edit live in memory and are gone when this process stops. Point DATABASE_URL at a Postgres and run `npx prisma db push` to keep them; the assets the app ships install themselves on the next boot.';

function memoryOnlyStore(): Store {
  return { enabled: false, disconnect: async () => undefined };
}

async function connectedStore(): Promise<Store> {
  const mod = (await import('@prisma/client')) as unknown as { PrismaClient: new () => PrismaLike };
  const prisma = new mod.PrismaClient();
  return { enabled: true, prisma, disconnect: () => prisma.$disconnect() };
}
