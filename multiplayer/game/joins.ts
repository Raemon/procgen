import { randomBytes } from 'node:crypto';
import type { HelloMsg } from '../client/protocol';
import { nearestWalkable } from '../../world/nearestWalkable';
import { signToken, verifyToken } from '../host/auth';
import type { Connection } from '../host/connection';
import { loadCharacter } from '../../server/persistence/characterRepo';
import type { ServerWorld } from '../../api/agent/serverWorld';
import type { WsDeps } from '../host/wsDeps';
import type { Entity } from './entities';

const SNAP_SEARCH_RADIUS = 64;

export async function joinConnection(conn: Connection, hello: HelloMsg, deps: WsDeps): Promise<void> {
  const name = sanitizeName(hello.name);
  const characterId = resumedCharacterId(hello, deps) ?? mintCharacterId();
  const entity = deps.registry.findByCharacterId(characterId)
    ? adoptFromDuplicateLogin(characterId, deps)
    : await spawnedEntity(characterId, name, deps);
  conn.entity = entity;
  conn.state = 'PLAYING';
  sendWelcome(conn, deps, characterId);
}

export function leaveConnection(conn: Connection, deps: WsDeps): void {
  deps.connections.delete(conn);
  if (!conn.entity) return;
  void deps.writeBehind.persistOne(conn.entity);
  deps.registry.remove(conn.entity.id);
  deps.feed.forgetEntityEverywhere(conn.entity.id);
  conn.entity = null;
}

function resumedCharacterId(hello: HelloMsg, deps: WsDeps): string | null {
  return hello.token ? verifyToken(deps.config.serverSecret, hello.token) : null;
}

function mintCharacterId(): string {
  return 'p_' + randomBytes(9).toString('base64url');
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

async function spawnedEntity(characterId: string, name: string, deps: WsDeps): Promise<Entity> {
  const world = deps.worldHost.current();
  const saved = await loadCharacter(deps.store, characterId);
  const spot = walkableSpot(world, saved?.x ?? null, saved?.y ?? null);
  return deps.registry.add(characterId, name, 'player', spot.x, spot.y, saved?.facing ?? 0);
}

function walkableSpot(world: ServerWorld, x: number | null, y: number | null): { x: number; y: number } {
  if (x === null || y === null) return world.spawn();
  if (world.isWalkable(x, y)) return { x, y };
  return nearestWalkable(x, y, SNAP_SEARCH_RADIUS, world.isWalkable) ?? world.spawn();
}

function sendWelcome(conn: Connection, deps: WsDeps, characterId: string): void {
  const entity = conn.entity!;
  conn.send({
    t: 'welcome',
    id: entity.id,
    x: entity.x,
    y: entity.y,
    facing: entity.facing,
    token: signToken(deps.config.serverSecret, characterId),
  });
  deps.feed.sendFullSnapshotTo(conn, deps.loop.tick);
}

function sanitizeName(raw: unknown): string {
  const cleaned = typeof raw === 'string' ? raw.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 24) : '';
  return cleaned === '' ? 'wanderer' : cleaned;
}
