import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export const API_KEY_TIP: TooltipContent = {
  title: 'Anthropic API key',
  body: 'Kept in this browser and sent with a run so the server can drive the agent on your account. Without one you can still move agents by hand over the API.',
};

export const AGENT_NAME_TIP: TooltipContent = {
  title: 'agent name',
  body: 'Optional label for the roster. Left blank, the server names the agent for you.',
};

export const AGENT_MODE_TIP: TooltipContent = {
  title: 'mode',
  body: 'What the agent gets to see and do when it plays.',
  options: [
    { name: 'character', meaning: 'walks the world from inside it, with only what it can see' },
    { name: 'god', meaning: 'reads the whole map from above' },
  ],
};

export const CREATE_AGENT_TIP: TooltipContent = {
  title: 'add agent',
  body: 'Puts a new agent in the world at a walkable spot, idle until you run it.',
};

export const MODEL_TIP: TooltipContent = {
  title: 'model',
  body: 'Which Claude model plays the agent. Bigger models plan better and cost more per step.',
};

export const GOAL_TIP: TooltipContent = {
  title: 'run goal',
  body: 'The standing instruction handed to the agent each step. Concrete goals — "map the coastline", "find the ruins" — read better than open-ended ones.',
};

export const BUDGET_TIP: TooltipContent = {
  title: 'budget',
  body: 'Ceiling for a single run, counted at list prices. The run stops when the spend reaches it.',
};
