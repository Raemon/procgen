import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { newAgentApiState } from '../api/agent/nodeEntry';
import { loadServerConfig } from './config';
import { AgentEntitySync } from '../multiplayer/game/agentEntitySync';
import { ChatFeed } from '../multiplayer/game/chatFeed';
import { afterWorldPersistedByAgent, type DocSyncDeps } from '../multiplayer/game/docSync';
import { EntityRegistry } from '../multiplayer/game/entities';
import { GameLoop } from '../multiplayer/game/gameLoop';
import { SnapshotFeed } from '../multiplayer/game/snapshotFeed';
import { createWorldHost } from '../multiplayer/game/worldHost';
import { mountAgentApi } from '../api/agentApiRoute';
import { mountPersistRoutes } from '../api/persistRoutes';
import { mountCodebaseDocs } from '../api/codebaseDocsRoute';
import { mountServerLoadRoute } from '../api/serverLoadRoute';
import { Router, sendJson } from '../api/router';
import { serveStatic } from './staticFiles';
import type { Connection } from '../multiplayer/host/connection';
import { attachWebSocket } from '../multiplayer/host/wsServer';
import { initStore } from './persistence/db';
import { createDocStore } from './persistence/docsRepo';
import { WriteBehind } from './persistence/writeBehind';

async function main(): Promise<void> {
  const config = loadServerConfig();
  const store = await initStore(config.databaseUrl);
  const docs = await createDocStore(store);

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
  mountCodebaseDocs(router);
  const stopWatchingServerLoad = mountServerLoadRoute(router);
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
    stopWatchingServerLoad();
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
