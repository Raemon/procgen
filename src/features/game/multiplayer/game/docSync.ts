import { nearestWalkable } from '../../nearestWalkable';
import type { Connection } from '../host/connection';
import { PERSISTED_DOC_NAMES } from '@/infrastructure/server/persistence/docsRepo';
import type { EntityRegistry } from './entities';
import type { WorldHost } from './worldHost';
import type { DocStore } from '@/infrastructure/server/persistence/docsRepo';

const SNAP_SEARCH_RADIUS = 64;

export interface DocSyncDeps {
  connections: Set<Connection>;
  registry: EntityRegistry;
  worldHost: WorldHost;
  docs: DocStore;
}

export function afterDocChanged(deps: DocSyncDeps, name: string): void {
  broadcastDocChanged(deps, name);
  snapEntitiesToWalkableGround(deps);
}

export function afterWorldPersistedByAgent(deps: DocSyncDeps): void {
  for (const name of PERSISTED_DOC_NAMES) broadcastDocChanged(deps, name);
  snapEntitiesToWalkableGround(deps);
}

function broadcastDocChanged(deps: DocSyncDeps, name: string): void {
  for (const conn of deps.connections) {
    if (conn.state === 'PLAYING') {
      conn.send({ t: 'docChanged', name, revision: deps.docs.revision(name) });
    }
  }
}

function snapEntitiesToWalkableGround(deps: DocSyncDeps): void {
  const world = deps.worldHost.current();
  for (const entity of deps.registry.byId.values()) {
    if (entity.kind !== 'player' || world.isWalkable(entity.x, entity.y)) continue;
    const spot = nearestWalkable(entity.x, entity.y, SNAP_SEARCH_RADIUS, world.isWalkable) ?? world.spawn();
    deps.registry.moveTo(entity, spot.x, spot.y);
  }
}
