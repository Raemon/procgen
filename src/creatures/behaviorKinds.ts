export const IDLE = 0;
export const WANDER = 1;
export const PATROL = 2;
export const CHASE = 3;
export const FLEE = 4;
export const GUARD = 5;

export interface BehaviorChoice {
  value: number;
  label: string;
  help: string;
}

export const BEHAVIOR_CHOICES: readonly BehaviorChoice[] = [
  { value: IDLE, label: 'idle', help: 'Stays on its spawn cell. Good for props, statues and penned animals.' },
  {
    value: WANDER,
    label: 'wander',
    help: 'Strolls to random spots within its roam radius of the spawn cell, pausing between hops.',
  },
  {
    value: PATROL,
    label: 'patrol',
    help: 'Paces back and forth along a fixed line through the spawn cell, roam tiles long.',
  },
  {
    value: CHASE,
    label: 'chase',
    help: 'Wanders until the player comes within sight, then heads straight for them.',
  },
  {
    value: FLEE,
    label: 'flee',
    help: 'Wanders until the player comes within sight, then runs directly away.',
  },
  {
    value: GUARD,
    label: 'guard',
    help: 'Chases the player while both stay near the spawn cell, then walks back home when they leave.',
  },
];

export function behaviorLabel(behavior: number): string {
  return BEHAVIOR_CHOICES.find((choice) => choice.value === behavior)?.label ?? 'wander';
}
