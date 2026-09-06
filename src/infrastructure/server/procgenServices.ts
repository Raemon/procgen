import '@/worlds/server';
import type { PersistedDocumentName } from '@/features/app-shell/persistence/persistedDocuments';
import type { Server as HttpServer } from 'node:http';
import { newAgentApiState, type AgentApiState } from '@/features/agents/api/nodeEntry';
import { AgentEntitySync } from '@/features/game/multiplayer/game/agentEntitySync';
import { ChatFeed } from '@/features/game/multiplayer/game/chatFeed';
import {
  afterDocChanged,
  afterWorldBuilt,
  type DocSyncDeps,
} from '@/features/game/multiplayer/game/docSync';
import { EntityRegistry } from '@/features/game/multiplayer/game/entities';
import { GameLoop } from '@/features/game/multiplayer/game/gameLoop';
import { joinConnection } from '@/features/game/multiplayer/game/joins';
import { SnapshotFeed } from '@/features/game/multiplayer/game/snapshotFeed';
import { WaitingRoom } from '@/features/game/multiplayer/game/waitingRoom';
import { createWorldHost } from '@/features/game/multiplayer/game/worldHost';
import type { Connection } from '@/features/game/multiplayer/host/connection';
import { attachWebSocket, type UpgradeHandler } from '@/features/game/multiplayer/host/wsServer';
import type { WsDeps } from '@/features/game/multiplayer/host/wsDeps';
import { EventLoopLagMonitor } from '@/features/game/performance/eventLoopLagMonitor';
import { loadServerConfig, type ServerConfig } from './config';
import { initStore, type Store } from './persistence/db';
import { createDocStore, type DocStore } from './persistence/docsRepo';
import { WriteBehind } from './persistence/writeBehind';
import { workerRunner } from './worldBuilds/buildRunners';
import { workerBundlePath } from './worldBuilds/workerBundle';
import { WorldBuildQueue } from './worldBuilds/worldBuildQueue';

export interface ProcgenServices {
  config: ServerConfig;
  store: Store;
  docs: DocStore;
  agents: AgentApiState;
  registry: EntityRegistry;
  loop: GameLoop;
  documentChanged(name: PersistedDocumentName): void;
  eventLoopLagMs(): number;
  attachGameSocket(server: HttpServer, handleUpgradeTheGameDoesNotOwn: UpgradeHandler): () => void;
  stop(): Promise<void>;
}

export async function createProcgenServices(): Promise<ProcgenServices> {
  const config = loadServerConfig();
  const store = await initStore(config.databaseUrl);
  const docs = await createDocStore(store);
  const builds = new WorldBuildQueue(workerRunner(workerBundlePath()));
  const agents = newAgentApiState(builds);
  const worldHost = createWorldHost(agents, docs);
  const registry = new EntityRegistry();
  const connections = new Set<Connection>();
  const feed = new SnapshotFeed(connections, registry);
  const chat = new ChatFeed(connections);
  const writeBehind = new WriteBehind(store, registry);
  const agentSync = new AgentEntitySync(agents.sessions, registry);
  const wsDeps = { config, store, registry, feed, chat, connections, worldHost, writeBehind } as WsDeps;
  const waitingRoom = new WaitingRoom(connections, worldHost, (conn) => joinConnection(conn, wsDeps));
  const loop = new GameLoop(registry, worldHost, feed, agentSync, waitingRoom);
  wsDeps.loop = loop;
  wsDeps.waitingRoom = waitingRoom;
  const docSync: DocSyncDeps = { connections, registry, worldHost, docs };
  const eventLoopLag = new EventLoopLagMonitor();

  builds.onChange(() => setTimeout(() => afterWorldBuilt(docSync), 0));
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
    attachGameSocket: (server, handleUpgradeTheGameDoesNotOwn) =>
      attachWebSocket(server, wsDeps, handleUpgradeTheGameDoesNotOwn),
    stop: async () => {
      loop.stop();
      writeBehind.stop();
      eventLoopLag.stop();
      await writeBehind.flush();
      await store.disconnect();
    },
  };
}
