import { Op, type SnapshotRow } from '../client/protocol';
import type { Connection } from '../host/connection';
import type { EntityRegistry } from './entities';

export class SnapshotFeed {
  constructor(
    private readonly connections: Set<Connection>,
    private readonly registry: EntityRegistry,
  ) {}

  broadcast(tick: number): void {
    const rows = this.snapshotRows();
    for (const conn of this.connections) this.sendSnapshotTo(conn, tick, rows);
  }

  sendFullSnapshotTo(conn: Connection, tick: number): void {
    this.sendSnapshotTo(conn, tick, this.snapshotRows());
  }

  forgetEntityEverywhere(entityId: number): void {
    for (const conn of this.connections) conn.knownEntities.delete(entityId);
  }

  private snapshotRows(): SnapshotRow[] {
    const rows: SnapshotRow[] = [];
    for (const e of this.registry.byId.values()) {
      rows.push([e.id, e.x, e.y, e.facing, e.cooldown, e.moveDir]);
    }
    return rows;
  }

  private sendSnapshotTo(conn: Connection, tick: number, rows: SnapshotRow[]): void {
    if (conn.state !== 'PLAYING') return;
    this.sendMetaForNewEntities(conn);
    conn.send([Op.Snapshot, tick, rows]);
  }

  private sendMetaForNewEntities(conn: Connection): void {
    for (const entity of this.registry.byId.values()) {
      if (conn.knownEntities.has(entity.id)) continue;
      conn.send({ t: 'entityMeta', id: entity.id, name: entity.name, kind: entity.kind });
      conn.knownEntities.add(entity.id);
    }
  }
}
