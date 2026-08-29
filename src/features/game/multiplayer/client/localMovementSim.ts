import {
  TICK_MS,
  holdDirection,
  releaseOrder,
  requestJump,
  type JumpRequest,
  restingBody,
  type MovingBody,
} from '../../sim/movementOrder';
import { tickMovement, type TickRules } from '../../sim/tickMovement';
import type { WalkabilityProbe } from '../../tileWalkability';
import type { FacingIndex } from '../../facing';
import type { World } from '../../world';

export class LocalMovementSim {
  private readonly body: MovingBody = restingBody();
  private readonly rules: TickRules;
  private timer = 0;

  constructor(
    private readonly world: World,
    isWalkableAt: WalkabilityProbe,
  ) {
    this.rules = { isWalkable: isWalkableAt, jumpRules: world.stepRules() };
  }

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

  jump(jump: JumpRequest): void {
    requestJump(this.body, jump);
  }

  private tickOnce(): void {
    const delta = tickMovement(this.body, this.world.playerX, this.world.playerY, this.rules);
    if (!delta) return;
    if (delta.jumped) this.world.landAfterJump(delta.dx, delta.dy);
    else this.world.tryStep(delta.dx, delta.dy);
  }
}
