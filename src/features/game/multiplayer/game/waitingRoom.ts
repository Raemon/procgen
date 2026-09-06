import { worldBuildSummary } from '@/features/agents/api/worldBuilding';
import type { Connection } from '../host/connection';
import type { WorldHost } from './worldHost';

const PROGRESS_EVERY_MS = 500;

export class WaitingRoom {
  private readonly admitting = new Set<Connection>();
  private lastToldAt = 0;

  constructor(
    private readonly connections: Set<Connection>,
    private readonly worldHost: WorldHost,
    private readonly admit: (conn: Connection) => Promise<void>,
  ) {}

  hold(conn: Connection): void {
    conn.state = 'WAITING';
    this.tellProgress(conn);
  }

  tick(now = Date.now()): void {
    const world = this.worldHost.current();
    if (world.ready()) {
      for (const conn of this.connections) if (conn.state === 'WAITING') this.admitOnce(conn);
      return;
    }
    if (now - this.lastToldAt < PROGRESS_EVERY_MS) return;
    this.lastToldAt = now;
    for (const conn of this.connections) if (conn.state === 'WAITING') this.tellProgress(conn);
  }

  private admitOnce(conn: Connection): void {
    if (this.admitting.has(conn)) return;
    this.admitting.add(conn);
    void this.admit(conn)
      .catch((err) => {
        console.error('[ws] join failed', err);
        conn.kick('abuse', 'join failed');
      })
      .finally(() => this.admitting.delete(conn));
  }

  private tellProgress(conn: Connection): void {
    const summary = worldBuildSummary(this.worldHost.current());
    conn.send({ t: 'building', fraction: summary.fraction, stage: summary.stage, elapsedMs: summary.elapsedMs });
  }
}
