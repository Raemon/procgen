import {
  TICK_MS,
  holdDirection,
  releaseOrder,
  restingBody,
  type MovingBody,
} from '../sim/movementOrder';
import { tickMovement, type WalkabilityProbe } from '../sim/tickMovement';
import type { FacingIndex } from '../world/facing';
import type { World } from '../world/world';

export class LocalMovementSim {
  private readonly body: MovingBody = restingBody();
  private timer = 0;

  constructor(
    private readonly world: World,
    private readonly isWalkableAt: WalkabilityProbe,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.tickOnce(), TICK_MS);
  }

  stop(): void {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
    Object.assign(this.body, restingBody());
  }

  hold(dir: FacingIndex): void {
    holdDirection(this.body, dir);
  }

  release(): void {
    releaseOrder(this.body);
  }

  private tickOnce(): void {
    const delta = tickMovement(this.body, this.world.playerX, this.world.playerY, this.isWalkableAt);
    if (delta) this.world.tryStep(delta.dx, delta.dy);
  }
}
