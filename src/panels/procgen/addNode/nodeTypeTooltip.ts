import type { NodeTypeDef } from '../../../procgen/nodeType';
import type { TooltipContent } from '../../../ui/tooltips/tooltipContent';

export function nodeTypeTooltip(def: NodeTypeDef): TooltipContent {
  return {
    title: def.title,
    body: def.description,
    when: def.whenToUse,
  };
}
