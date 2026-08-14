import { TICK_MS } from '../../sim/movementOrder';
import { tickMovement } from '../../sim/tickMovement';
import type { AgentEntitySync } from './agentEntitySync';
import type { EntityRegistry } from './entities';
import type { SnapshotFeed } from './snapshotFeed';
import type { WorldHost } from './worldHost';

const MAX_LAG_TICKS = 5;

export class GameLoop {
  tick = 0;
  private running = false;
  private nextAt = 0;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly registry: EntityRegistry,
    private readonly worldHost: WorldHost,
    private readonly feed: SnapshotFeed,
    private readonly agentSync: AgentEntitySync,
  ) {}

  start(): void {
    this.running = true;
    this.nextAt = Date.now() + TICK_MS;
    this.schedule();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(): void {
    this.timer = setTimeout(() => this.run(), Math.max(0, this.nextAt - Date.now()));
  }

  private run(): void {
    if (!this.running) return;
    try {
      this.step();
    } catch (err) {
      console.error('[tick] error', err);
    }
    this.nextAt += TICK_MS;
    if (this.nextAt < Date.now() - MAX_LAG_TICKS * TICK_MS) this.nextAt = Date.now();
    this.schedule();
  }

  private step(): void {
    this.agentSync.sync();
    this.stepPlayers();
    this.feed.broadcast(this.tick);
    this.tick++;
  }

  private stepPlayers(): void {
    const world = this.worldHost.current();
    for (const entity of this.registry.byId.values()) {
      if (entity.kind !== 'player') continue;
      const delta = tickMovement(
        entity,
        entity.x,
        entity.y,
        world.isWalkable,
        world.stepRules.climbGateAt,
      );
      if (delta) this.registry.moveTo(entity, entity.x + delta.dx, entity.y + delta.dy);
    }
  }
}
