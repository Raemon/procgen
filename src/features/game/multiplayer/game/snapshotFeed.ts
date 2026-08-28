import { Op, type CreatureRow, type SnapshotRow } from '../client/protocol';
import type { PuzzleState } from '../../puzzles/state/puzzleState';
import type { CreatureInstance } from '../../creatureSim/creatureInstance';
import type { Connection } from '../host/connection';
import type { EntityRegistry } from './entities';

const CREATURE_BROADCAST_EVERY_TICKS = 2;

export class SnapshotFeed {
  constructor(
    private readonly connections: Set<Connection>,
    private readonly registry: EntityRegistry,
    private readonly liveCreatures: () => readonly CreatureInstance[],
  ) {}

  broadcast(tick: number): void {
    const rows = this.snapshotRows();
    for (const conn of this.connections) this.sendSnapshotTo(conn, tick, rows);
    if (tick % CREATURE_BROADCAST_EVERY_TICKS === 0) this.broadcastCreatures(tick);
  }

  broadcastCreatures(tick: number): void {
    const rows = this.creatureRows();
    for (const conn of this.connections) {
      if (conn.state === 'PLAYING') conn.send([Op.Creatures, tick, rows]);
    }
  }

  private creatureRows(): CreatureRow[] {
    return this.liveCreatures().map((creature) => [
      creature.id,
      creature.creatureId,
      round2(creature.x),
      round2(creature.y),
      round2(creature.heading),
      creature.moving ? 1 : 0,
      creature.hp,
    ]);
  }

  sendFullSnapshotTo(conn: Connection, tick: number): void {
    this.sendSnapshotTo(conn, tick, this.snapshotRows());
    conn.send([Op.Creatures, tick, this.creatureRows()]);
  }

  forgetEntityEverywhere(entityId: number): void {
    for (const conn of this.connections) conn.knownEntities.delete(entityId);
  }

  broadcastPuzzles(state: PuzzleState): void {
    for (const conn of this.connections) this.sendPuzzlesTo(conn, state);
  }

  sendPuzzlesTo(conn: Connection, state: PuzzleState): void {
    if (conn.state !== 'PLAYING') return;
    const snapshot = state.snapshot();
    conn.send({ t: 'puzzles', on: snapshot.on, crates: snapshot.crates });
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
