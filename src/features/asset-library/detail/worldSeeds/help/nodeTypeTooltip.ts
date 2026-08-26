import type { NodeTypeDef } from '@/features/asset-library/worlds/nodeType';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export function nodeTypeTooltip(def: NodeTypeDef): TooltipContent {
  return {
    title: def.title,
    body: def.description,
    when: def.whenToUse,
  };
}
