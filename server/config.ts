export interface ServerConfig {
  port: number;
  root: string;
  clientDist: string;
  databaseUrl: string | null;
  serverSecret: string;
}

export function loadServerConfig(): ServerConfig {
  const secret = process.env.SERVER_SECRET;
  if (!secret) console.warn('[config] SERVER_SECRET not set — using a dev secret; tokens are forgeable.');
  return {
    port: Number(process.env.PORT ?? 8080),
    root: process.cwd(),
    clientDist: process.env.CLIENT_DIST ?? 'dist',
    databaseUrl: process.env.DATABASE_URL ?? null,
    serverSecret: secret ?? 'procgen-dev-secret-change-me',
  };
}
