import type { SessionStore } from '../../src/agent/api/sessions';
import type { Entity, EntityRegistry } from './entities';

export class AgentEntitySync {
  private readonly entityBySessionId = new Map<string, Entity>();

  constructor(
    private readonly sessions: SessionStore,
    private readonly registry: EntityRegistry,
  ) {}

  sync(): void {
    for (const session of this.sessions.values()) this.syncOne(session.id);
    this.dropEndedSessions();
  }

  private syncOne(sessionId: string): void {
    const session = this.sessions.get(sessionId)!;
    const entity = this.entityBySessionId.get(sessionId) ?? this.adopt(sessionId);
    if (entity.x !== session.x || entity.y !== session.y) this.registry.moveTo(entity, session.x, session.y);
    if (entity.facing !== session.facing) this.registry.faceToward(entity, session.facing);
    entity.persistDirty = false;
  }

  private adopt(sessionId: string): Entity {
    const session = this.sessions.get(sessionId)!;
    const entity = this.registry.add(sessionId, session.name, 'agent', session.x, session.y, session.facing);
    this.entityBySessionId.set(sessionId, entity);
    return entity;
  }

  private dropEndedSessions(): void {
    for (const [sessionId, entity] of this.entityBySessionId) {
      if (this.sessions.has(sessionId)) continue;
      this.registry.remove(entity.id);
      this.entityBySessionId.delete(sessionId);
    }
  }
}
