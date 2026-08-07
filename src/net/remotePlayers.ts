import type { FacingIndex } from '../world/facing';
import type { EntityKind, EntityMetaMsg, SnapshotRow } from './protocol';

export interface RemoteEntity {
  id: number;
  name: string;
  kind: EntityKind;
  x: number;
  y: number;
  facing: FacingIndex;
  cooldown: number;
  moveDir: number;
}

export class RemotePlayers {
  selfId = 0;
  private readonly entities = new Map<number, RemoteEntity>();
  private readonly metas = new Map<number, { name: string; kind: EntityKind }>();

  applyMeta(msg: EntityMetaMsg): void {
    this.metas.set(msg.id, { name: msg.name, kind: msg.kind });
    const entity = this.entities.get(msg.id);
    if (entity) {
      entity.name = msg.name;
      entity.kind = msg.kind;
    }
  }

  applySnapshot(rows: SnapshotRow[]): SnapshotRow | null {
    const liveIds = new Set<number>();
    let selfRow: SnapshotRow | null = null;
    for (const row of rows) {
      liveIds.add(row[0]);
      if (row[0] === this.selfId) selfRow = row;
      else this.upsert(row);
    }
    for (const id of [...this.entities.keys()]) if (!liveIds.has(id)) this.entities.delete(id);
    return selfRow;
  }

  others(): Iterable<RemoteEntity> {
    return this.entities.values();
  }

  clear(): void {
    this.entities.clear();
  }

  private upsert(row: SnapshotRow): void {
    const [id, x, y, facing, cooldown, moveDir] = row;
    const existing = this.entities.get(id);
    if (existing) {
      existing.x = x;
      existing.y = y;
      existing.facing = facing as FacingIndex;
      existing.cooldown = cooldown;
      existing.moveDir = moveDir;
      return;
    }
    const meta = this.metas.get(id);
    this.entities.set(id, {
      id,
      name: meta?.name ?? 'wanderer',
      kind: meta?.kind ?? 'player',
      x,
      y,
      facing: facing as FacingIndex,
      cooldown,
      moveDir,
    });
  }
}
