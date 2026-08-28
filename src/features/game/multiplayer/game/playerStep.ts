import { playerCanEnter, type PushablePlaces } from '../../puzzles/playerCanEnter';
import { jumpLandingDelta } from '../../sim/jumpLanding';
import { stepIsAllowed, type StepRules } from '../../sim/stepIsAllowed';
import { tickMovement } from '../../sim/tickMovement';
import type { Entity, EntityRegistry } from './entities';

export interface PlayerStepWorld {
  isWalkable(x: number, y: number): boolean;
  stepRules: StepRules;
  puzzles: PushablePlaces & { takeKeysAt(x: number, y: number): string[] };
}

export function stepPlayerEntity(
  world: PlayerStepWorld,
  registry: EntityRegistry,
  entity: Entity,
): void {
  const canEnter = playerCanEnter(world.isWalkable, world.puzzles, () => entity);
  const delta = tickMovement(entity, entity.x, entity.y, {
    isWalkable: canEnter,
    climbGateAt: world.stepRules.climbGateAt,
    jumpTo: (fromX, fromY, dx, dy) => jumpLandingDelta(world.stepRules, fromX, fromY, dx, dy),
  });
  if (!delta) return;
  const nextX = entity.x + delta.dx;
  const nextY = entity.y + delta.dy;
  if (!delta.jumped && !stepIsAllowed(world.stepRules, nextX, nextY, delta.dx, delta.dy)) return;
  registry.moveTo(entity, nextX, nextY);
  world.puzzles.takeKeysAt(nextX, nextY);
}
