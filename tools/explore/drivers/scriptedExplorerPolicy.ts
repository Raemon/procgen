import { hashString } from '../../../procgen/random/hashString';
import { mulberry32 } from '../../../procgen/random/mulberry32';
import type { AgentAction, AgentPolicy, AgentTurnView } from './agentPolicy';

export const SCRIPTED_POLICY_NAME = 'scripted';

const STEPS_BEFORE_LOOKING_AROUND = 6;

export function scriptedExplorerPolicy(seed: number): AgentPolicy {
  const rng = mulberry32(hashString(`${SCRIPTED_POLICY_NAME}:${seed}`));
  let stepsSinceTurn = 0;
  const turnAside = (): AgentAction => {
    stepsSinceTurn = 0;
    return { action: rng() < 0.5 ? 'turn_left' : 'turn_right', params: {} };
  };
  const walkOn = (): AgentAction => {
    stepsSinceTurn += 1;
    return { action: 'step_forward', params: {} };
  };
  const chooseMove = (view: AgentTurnView): AgentAction => {
    if (view.lastFailure !== null) return turnAside();
    if (stepsSinceTurn >= STEPS_BEFORE_LOOKING_AROUND) return turnAside();
    return walkOn();
  };
  return {
    name: SCRIPTED_POLICY_NAME,
    decide: (view) => Promise.resolve(chooseMove(view)),
  };
}
