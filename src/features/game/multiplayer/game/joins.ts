import { randomBytes } from 'node:crypto';
import { nearestWalkable } from '../../nearestWalkable';
import type { Connection } from '../host/connection';
import { loadCharacter } from '@/infrastructure/server/persistence/characterRepo';
import type { ServerWorld } from '../../../agents/api/serverWorld';
import type { WsDeps } from '../host/wsDeps';
import type { Entity } from './entities';

const SNAP_SEARCH_RADIUS = 64;

export async function joinConnection(conn: Connection, deps: WsDeps): Promise<void> {
  const characterId = conn.characterId;
  const entity = deps.registry.findByCharacterId(characterId)
    ? adoptFromDuplicateLogin(characterId, deps)
    : await spawnedEntity(characterId, deps);
  conn.entity = entity;
  conn.state = 'PLAYING';
  sendWelcome(conn, deps);
}

export function leaveConnection(conn: Connection, deps: WsDeps): void {
  deps.connections.delete(conn);
  if (!conn.entity) return;
  void deps.writeBehind.persistOne(conn.entity);
  deps.registry.remove(conn.entity.id);
  deps.feed.forgetEntityEverywhere(conn.entity.id);
  conn.entity = null;
}

function adoptFromDuplicateLogin(characterId: string, deps: WsDeps): Entity {
  const entity = deps.registry.findByCharacterId(characterId)!;
  for (const other of deps.connections) {
    if (other.entity !== entity) continue;
    other.entity = null;
    other.kick('duplicate', 'this character connected from another tab');
  }
  return entity;
}

async function spawnedEntity(characterId: string, deps: WsDeps): Promise<Entity> {
  const world = deps.worldHost.current();
  const saved = await loadCharacter(deps.store, characterId);
  const spot = walkableSpot(world, saved?.x ?? null, saved?.y ?? null);
  const name = sanitizeName(saved?.name) ?? mintPlayerName();
  return deps.registry.add(characterId, name, 'player', spot.x, spot.y, saved?.facing ?? 0);
}

function mintPlayerName(): string {
  return 'wanderer-' + randomBytes(3).toString('hex');
}

function walkableSpot(world: ServerWorld, x: number | null, y: number | null): { x: number; y: number } {
  if (x === null || y === null) return world.spawn();
  if (world.isWalkable(x, y)) return { x, y };
  return nearestWalkable(x, y, SNAP_SEARCH_RADIUS, world.isWalkable) ?? world.spawn();
}

function sendWelcome(conn: Connection, deps: WsDeps): void {
  const entity = conn.entity!;
  conn.send({
    t: 'welcome',
    id: entity.id,
    x: entity.x,
    y: entity.y,
    facing: entity.facing,
  });
  deps.feed.sendFullSnapshotTo(conn, deps.loop.tick);
}

function sanitizeName(raw: unknown): string | null {
  const cleaned = typeof raw === 'string' ? raw.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 24) : '';
  return cleaned === '' ? null : cleaned;
}
