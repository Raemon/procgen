import { TICK_MS } from '../../sim/movementOrder';
import type { AgentEntitySync } from './agentEntitySync';
import { stepPlayerEntity } from './playerStep';
import type { EntityRegistry } from './entities';
import type { SnapshotFeed } from './snapshotFeed';
import type { WaitingRoom } from './waitingRoom';
import type { WorldHost } from './worldHost';

const MAX_LAG_TICKS = 5;

export class GameLoop {
  tick = 0;
  private running = false;
  private nextAt = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private lastSharedRevision: number | null = null;

  constructor(
    private readonly registry: EntityRegistry,
    private readonly worldHost: WorldHost,
    private readonly feed: SnapshotFeed,
    private readonly agentSync: AgentEntitySync,
    private readonly waitingRoom: WaitingRoom | null = null,
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
    this.waitingRoom?.tick();
    this.stepPlayers();
    this.shareStateChanges();
    this.feed.broadcast(this.tick);
    this.tick++;
  }

  private stepPlayers(): void {
    const world = this.worldHost.current();
    if (!world.ready()) return;
    for (const entity of this.registry.byId.values()) {
      if (entity.kind === 'player') stepPlayerEntity(world, this.registry, entity);
    }
  }

  private shareStateChanges(): void {
    const rules = this.worldHost.current().rules;
    const revision = rules.revision();
    if (revision === this.lastSharedRevision) return;
    const isFirstLook = this.lastSharedRevision === null;
    this.lastSharedRevision = revision;
    if (!isFirstLook) this.feed.broadcastShared(rules.snapshot());
  }
}
