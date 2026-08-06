export interface RunSettings {
  model: string;
  goal: string;
  maxSteps: number;
  budgetUsd: number;
}

export const MODEL_OPTIONS = [
  { value: 'claude-sonnet-5', text: 'Sonnet 5 — capable default' },
  { value: 'claude-haiku-4-5-20251001', text: 'Haiku 4.5 — fast and cheap' },
  { value: 'claude-opus-5', text: 'Opus 5 — most capable' },
] as const;

export function defaultRunSettings(): RunSettings {
  return {
    model: MODEL_OPTIONS[0].value,
    goal: 'Explore and describe the terrain you find.',
    maxSteps: 30,
    budgetUsd: 1,
  };
}
