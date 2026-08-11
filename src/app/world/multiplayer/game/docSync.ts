import { nearestWalkable } from '../../world/nearestWalkable';
import type { Connection } from '../host/connection';
import { PERSISTED_DOC_NAMES } from '../../server/persistence/docsRepo';
import type { EntityRegistry } from './entities';
import type { WorldHost } from './worldHost';

const SNAP_SEARCH_RADIUS = 64;

export interface DocSyncDeps {
  connections: Set<Connection>;
  registry: EntityRegistry;
  worldHost: WorldHost;
}

export function afterDocChanged(deps: DocSyncDeps, name: string): void {
  broadcastDocChanged(deps.connections, name);
  snapEntitiesToWalkableGround(deps);
}

export function afterWorldPersistedByAgent(deps: DocSyncDeps): void {
  for (const name of PERSISTED_DOC_NAMES) broadcastDocChanged(deps.connections, name);
  snapEntitiesToWalkableGround(deps);
}

function broadcastDocChanged(connections: Set<Connection>, name: string): void {
  for (const conn of connections) {
    if (conn.state === 'PLAYING') conn.send({ t: 'docChanged', name });
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
