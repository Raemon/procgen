import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { newAgentApiState } from '../src/agent/api/nodeEntry';
import { loadServerConfig } from './config';
import { AgentEntitySync } from './game/agentEntitySync';
import { ChatFeed } from './game/chatFeed';
import { afterWorldPersistedByAgent, type DocSyncDeps } from './game/docSync';
import { EntityRegistry } from './game/entities';
import { GameLoop } from './game/gameLoop';
import { SnapshotFeed } from './game/snapshotFeed';
import { createWorldHost } from './game/worldHost';
import { mountAgentApi } from './http/agentApiRoute';
import { mountPersistRoutes } from './http/persistRoutes';
import { Router, sendJson } from './http/router';
import { serveStatic } from './http/staticFiles';
import type { Connection } from './net/connection';
import { attachWebSocket } from './net/wsServer';
import { initStore } from './persist/db';
import { createDocStore } from './persist/docsRepo';
import { WriteBehind } from './persist/writeBehind';

async function main(): Promise<void> {
  const config = loadServerConfig();
  const store = await initStore(config.databaseUrl);
  const docs = await createDocStore(store, config.root);

  const agentState = newAgentApiState();
  const worldHost = createWorldHost(agentState, docs);
  const registry = new EntityRegistry();
  const connections = new Set<Connection>();
  const feed = new SnapshotFeed(connections, registry);
  const chat = new ChatFeed(connections);
  const writeBehind = new WriteBehind(store, registry);
  const agentSync = new AgentEntitySync(agentState.sessions, registry);
  const loop = new GameLoop(registry, worldHost, feed, agentSync);
  const docSyncDeps: DocSyncDeps = { connections, registry, worldHost };

  const router = new Router();
  mountPersistRoutes(router, docs, docSyncDeps);
  mountAgentApi(router, agentState, docs, () => afterWorldPersistedByAgent(docSyncDeps));
  router.get('/healthz', (_req, res) =>
    sendJson(res, 200, {
      ok: true,
      tick: loop.tick,
      players: registry.countByKind('player'),
      agents: registry.countByKind('agent'),
      persistence: store.enabled,
    }),
  );

  const dist = resolve(config.root, config.clientDist);
  const httpServer = createServer((req, res) => {
    if (router.handle(req, res)) return;
    serveStatic(dist, req, res);
  });
  const detachWebSocket = attachWebSocket(httpServer, {
    config,
    store,
    registry,
    feed,
    chat,
    loop,
    connections,
    worldHost,
    writeBehind,
  });

  loop.start();
  writeBehind.start();

  httpServer.listen(config.port, () => {
    console.log(`[server] procgen multiplayer listening on http://localhost:${config.port}`);
  });

  installShutdown(async () => {
    loop.stop();
    writeBehind.stop();
    detachWebSocket();
    await writeBehind.flush();
    await store.disconnect();
    httpServer.close();
  });
}

function installShutdown(shutdown: () => Promise<void>): void {
  let shuttingDown = false;
  const once = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    void shutdown().finally(() => process.exit(0));
  };
  process.on('SIGTERM', once);
  process.on('SIGINT', once);
}

void main().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
