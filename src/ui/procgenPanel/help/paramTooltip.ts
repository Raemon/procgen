import type { ParamSpec } from '../../../procgen/nodeType';
import type { TooltipContent, TooltipOption } from '../../tooltips/tooltipContentElements';

export function paramTooltip(spec: ParamSpec): TooltipContent {
  if (spec.kind === 'choice') return { title: spec.label, body: spec.help, options: choiceOptions(spec) };
  if (spec.kind === 'select') return { title: spec.label, body: spec.help, options: selectOptions(spec) };
  if (spec.kind === 'tile') return { title: spec.label, body: spec.help, options: tileOptions() };
  return { title: spec.label, body: spec.help };
}

function choiceOptions(spec: Extract<ParamSpec, { kind: 'choice' }>): TooltipOption[] {
  return spec.options.map((option) => ({ name: option.label, meaning: option.help }));
}

function selectOptions(spec: Extract<ParamSpec, { kind: 'select' }>): TooltipOption[] {
  return spec.options.map((option) => ({ name: option, meaning: spec.optionHelp[option] ?? '' }));
}

function tileOptions(): TooltipOption[] {
  return [
    { name: '(empty)', meaning: 'Paints nothing, so layers listed above this node stay visible in those cells.' },
    {
      name: 'tileset tiles',
      meaning: 'Paints that tile. Its symbol and colors come from the tile panel, so tile edits restyle the world live.',
    },
  ];
}
