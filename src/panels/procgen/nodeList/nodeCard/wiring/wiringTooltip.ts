import type { InputSpec } from '../../../../../procgen/nodeType';
import type { TooltipContent, TooltipOption } from '../../../../../ui/tooltips/tooltipContent';

export function wiringTooltip(spec: InputSpec): TooltipContent {
  return {
    title: `input: ${spec.label}`,
    body: spec.help,
    options: [placeholderOption(spec), candidateOption(spec)],
    when: 'Only nodes above this one are listed — reorder with ↑/↓ to make a source available.',
  };
}

function placeholderOption(spec: InputSpec): TooltipOption {
  if (spec.optional) return { name: '(none)', meaning: 'Leave unwired; the node falls back to its unmasked/default behavior.' };
  return { name: '(required)', meaning: 'Not wired yet — the node produces nothing until a source is chosen.' };
}

function candidateOption(spec: InputSpec): TooltipOption {
  const kindWord = spec.kind === 'any' ? 'any value' : spec.kind;
  return {
    name: `listed nodes`,
    meaning: `Earlier nodes producing ${kindWord}; the chosen node's output feeds this input, even if that node displays as hidden.`,
  };
}
