import { FACING_NAMES } from '../world/facing';
import type { AgentMode } from './agentMode';

export interface VerbSpec {
  action: string;
  mode: AgentMode;
  humanControl: string;
  description: string;
}

const GOD_STEP_VERBS: readonly VerbSpec[] = FACING_NAMES.map((name) => ({
  action: `step_${name}`,
  mode: 'god' as AgentMode,
  humanControl: 'WASD/arrows, camera-relative',
  description: `Step one tile ${name}.`,
}));

const CHARACTER_VERBS: readonly VerbSpec[] = [
  {
    action: 'step_forward',
    mode: 'character',
    humanControl: 'W / ↑',
    description: 'Step one tile in the direction you face.',
  },
  {
    action: 'step_back',
    mode: 'character',
    humanControl: 'S / ↓',
    description: 'Step one tile away from the direction you face.',
  },
  {
    action: 'strafe_left',
    mode: 'character',
    humanControl: 'A / ←',
    description: 'Step one tile to your left without turning.',
  },
  {
    action: 'strafe_right',
    mode: 'character',
    humanControl: 'D / →',
    description: 'Step one tile to your right without turning.',
  },
  {
    action: 'turn_left',
    mode: 'character',
    humanControl: 'Q',
    description: 'Turn 45° left. Turning always succeeds.',
  },
  {
    action: 'turn_right',
    mode: 'character',
    humanControl: 'E',
    description: 'Turn 45° right. Turning always succeeds.',
  },
];

export const ALL_VERBS: readonly VerbSpec[] = [...GOD_STEP_VERBS, ...CHARACTER_VERBS];

export function verbsForMode(mode: AgentMode): readonly VerbSpec[] {
  return ALL_VERBS.filter((verb) => verb.mode === mode);
}

export function verbByAction(mode: AgentMode, action: string): VerbSpec | undefined {
  return verbsForMode(mode).find((verb) => verb.action === action);
}
