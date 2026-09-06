import type { CommandActor } from '@/features/app-shell/runtime/commands/command';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '../../vision/characterSight';
import { DEFAULT_GOD_VIEW_SIZE_TILES } from '../../vision/godViewSize';
import { turnedFacing } from '../../facing';
import { jumpLandingDelta } from '../../sim/jumpLanding';
import { isAxisStep } from '../../sim/stepIsAllowed';
import { mineSlotsOf, stepRulesOf, type WorldRulesSet } from '../../worldRulesSet';
import type { Entity, EntityRegistry } from './entities';

export function entityActor(entity: Entity, registry: EntityRegistry, rules: WorldRulesSet): CommandActor {
  const mine = mineSlotsOf(entity.mine, rules);
  const stepRules = stepRulesOf(rules, mine);
  return {
    pose: () => ({ x: entity.x, y: entity.y, facing: entity.facing }),
    snapTo: (x, y, facing) => {
      registry.moveTo(entity, x, y);
      registry.faceToward(entity, facing);
    },
    tryStep: (dx, dy, mayPush = isAxisStep(dx, dy)) => {
      const from = { x: entity.x, y: entity.y };
      const to = { x: from.x + dx, y: from.y + dy };
      if (!stepRules.step(from, to, dx, dy, mayPush, true).allowed) return false;
      registry.moveTo(entity, to.x, to.y);
      return true;
    },
    explainStep: (dx, dy, mayPush = isAxisStep(dx, dy)) => {
      const from = { x: entity.x, y: entity.y };
      const verdict = stepRules.step(from, { x: from.x + dx, y: from.y + dy }, dx, dy, mayPush, false);
      return verdict.allowed ? null : verdict.why;
    },
    tryJump: (dx, dy) => {
      const delta = jumpLandingDelta(stepRules, entity.x, entity.y, dx, dy);
      if (!delta) return false;
      registry.moveTo(entity, entity.x + delta.dx, entity.y + delta.dy);
      return true;
    },
    turn: (eighthTurns) => registry.faceToward(entity, turnedFacing(entity.facing, eighthTurns)),
    sightRadiusTiles: () => DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
    setSightRadiusTiles: () => undefined,
    godViewSizeTiles: () => DEFAULT_GOD_VIEW_SIZE_TILES,
    setGodViewSizeTiles: () => undefined,
    mine,
  };
}
