import type { Server as HttpServer } from 'node:http';
import { newAgentApiState, type AgentApiState } from '@/features/agents/api/nodeEntry';
import { AgentEntitySync } from '@/features/game/multiplayer/game/agentEntitySync';
import { ChatFeed } from '@/features/game/multiplayer/game/chatFeed';
import {
  afterDocChanged,
  type DocSyncDeps,
} from '@/features/game/multiplayer/game/docSync';
import { EntityRegistry } from '@/features/game/multiplayer/game/entities';
import { GameLoop } from '@/features/game/multiplayer/game/gameLoop';
import { SnapshotFeed } from '@/features/game/multiplayer/game/snapshotFeed';
import { createWorldHost } from '@/features/game/multiplayer/game/worldHost';
import type { Connection } from '@/features/game/multiplayer/host/connection';
import { attachWebSocket } from '@/features/game/multiplayer/host/wsServer';
import { EventLoopLagMonitor } from '@/features/game/performance/eventLoopLagMonitor';
import { loadServerConfig, type ServerConfig } from './config';
import { initStore, type Store } from './persistence/db';
import { createDocStore, type DocStore } from './persistence/docsRepo';
import { WriteBehind } from './persistence/writeBehind';

export interface ProcgenServices {
  config: ServerConfig;
  store: Store;
  docs: DocStore;
  agents: AgentApiState;
  registry: EntityRegistry;
  loop: GameLoop;
  documentChanged(name: string): void;
  eventLoopLagMs(): number;
  attachGameSocket(server: HttpServer): () => void;
  stop(): Promise<void>;
}

export async function createProcgenServices(): Promise<ProcgenServices> {
  const config = loadServerConfig();
  const store = await initStore(config.databaseUrl);
  const docs = await createDocStore(store);
  const agents = newAgentApiState();
  const worldHost = createWorldHost(agents, docs);
  const registry = new EntityRegistry();
  const connections = new Set<Connection>();
  const feed = new SnapshotFeed(connections, registry);
  const chat = new ChatFeed(connections);
  const writeBehind = new WriteBehind(store, registry);
  const agentSync = new AgentEntitySync(agents.sessions, registry);
  const loop = new GameLoop(registry, worldHost, feed, agentSync);
  const docSync: DocSyncDeps = { connections, registry, worldHost, docs };
  const eventLoopLag = new EventLoopLagMonitor();

  loop.start();
  writeBehind.start();
  eventLoopLag.start();

  return {
    config,
    store,
    docs,
    agents,
    registry,
    loop,
    documentChanged: (name) => afterDocChanged(docSync, name),
    eventLoopLagMs: () => eventLoopLag.latestLagMs(),
    attachGameSocket: (server) =>
      attachWebSocket(server, {
        config,
        store,
        registry,
        feed,
        chat,
        loop,
        connections,
        worldHost,
        writeBehind,
      }),
    stop: async () => {
      loop.stop();
      writeBehind.stop();
      eventLoopLag.stop();
      await writeBehind.flush();
      await store.disconnect();
    },
  };
}

export function healthOf(loop: GameLoop, registry: EntityRegistry) {
  return {
    ok: true,
    tick: loop.tick,
    players: registry.countByKind('player'),
    agents: registry.countByKind('agent'),
  };
}
