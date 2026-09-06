import { jumpLandingDelta } from './jumpLanding';
import { isAxisStep, type StepRules } from './stepIsAllowed';
import type { TickRules } from './tickMovement';

export function tickRulesOf(rules: StepRules): TickRules {
  return {
    canStepTo: (fromX, fromY, toX, toY) => {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const from = { x: fromX, y: fromY };
      return rules.step(from, { x: toX, y: toY }, dx, dy, isAxisStep(dx, dy), false).allowed;
    },
    jumpLanding: (fromX, fromY, dx, dy) => jumpLandingDelta(rules, fromX, fromY, dx, dy),
  };
}
