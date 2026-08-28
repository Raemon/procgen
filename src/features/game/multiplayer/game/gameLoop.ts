import { TICK_MS } from '../../sim/movementOrder';
import type { AgentEntitySync } from './agentEntitySync';
import { stepPlayerEntity } from './playerStep';
import type { EntityRegistry } from './entities';
import type { SnapshotFeed } from './snapshotFeed';
import type { WorldHost } from './worldHost';

const MAX_LAG_TICKS = 5;

export class GameLoop {
  tick = 0;
  private running = false;
  private nextAt = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private lastPuzzleRevision: number | null = null;

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
    this.worldHost.liveCreatures().step(TICK_MS / 1000);
    this.sharePuzzleChanges();
    this.feed.broadcast(this.tick);
    this.tick++;
  }

  private stepPlayers(): void {
    const world = this.worldHost.current();
    for (const entity of this.registry.byId.values()) {
      if (entity.kind === 'player') stepPlayerEntity(world, this.registry, entity);
    }
  }

  private sharePuzzleChanges(): void {
    const revision = this.worldHost.current().puzzles.state.revision();
    if (revision === this.lastPuzzleRevision) return;
    const isFirstLook = this.lastPuzzleRevision === null;
    this.lastPuzzleRevision = revision;
    if (!isFirstLook) this.feed.broadcastPuzzles(this.worldHost.current().puzzles.state);
  }
}
