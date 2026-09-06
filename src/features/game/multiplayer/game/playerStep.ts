import { isAxisStep } from '../../sim/stepIsAllowed';
import { tickMovement } from '../../sim/tickMovement';
import { tickRulesOf } from '../../sim/tickRules';
import { mineSlotsOf, stepRulesOf, type WorldRulesSet } from '../../worldRulesSet';
import type { Entity, EntityRegistry } from './entities';

export interface PlayerStepWorld {
  rules: WorldRulesSet;
}

export function stepPlayerEntity(
  world: PlayerStepWorld,
  registry: EntityRegistry,
  entity: Entity,
): void {
  const rules = stepRulesOf(world.rules, mineSlotsOf(entity.mine, world.rules));
  const delta = tickMovement(entity, entity.x, entity.y, tickRulesOf(rules));
  if (!delta) return;
  if (delta.dx === 0 && delta.dy === 0) return;
  const from = { x: entity.x, y: entity.y };
  const to = { x: from.x + delta.dx, y: from.y + delta.dy };
  if (!delta.jumped) {
    const mayPush = isAxisStep(delta.dx, delta.dy);
    if (!rules.step(from, to, delta.dx, delta.dy, mayPush, true).allowed) return;
  }
  registry.moveTo(entity, to.x, to.y);
}
