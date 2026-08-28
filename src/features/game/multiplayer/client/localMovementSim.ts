import {
  TICK_MS,
  holdDirection,
  releaseOrder,
  requestJump,
  restingBody,
  type MovingBody,
} from '../../sim/movementOrder';
import { tickMovement, type WalkabilityProbe } from '../../sim/tickMovement';
import type { FacingIndex } from '../../facing';
import type { World } from '../../world';

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

  jump(dir: FacingIndex | null): void {
    requestJump(this.body, dir);
  }

  private tickOnce(): void {
    const delta = tickMovement(this.body, this.world.playerX, this.world.playerY, {
      isWalkable: this.isWalkableAt,
      jumpTo: (fromX, fromY, dx, dy) => this.world.jumpLandingFrom(fromX, fromY, dx, dy),
    });
    if (!delta) return;
    if (delta.jumped) this.world.landAfterJump(delta.dx, delta.dy);
    else this.world.tryStep(delta.dx, delta.dy);
  }
}
