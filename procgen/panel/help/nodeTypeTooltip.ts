import type { NodeTypeDef } from '../../nodeType';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';

export function nodeTypeTooltip(def: NodeTypeDef): TooltipContent {
  return {
    title: def.title,
    body: def.description,
    when: def.whenToUse,
  };
}
