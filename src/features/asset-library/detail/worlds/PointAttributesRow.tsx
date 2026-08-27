import type { PointAttrSpec } from '@/features/asset-library/worlds/nodeType';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export function PointAttributesRow({ attributes }: { attributes: readonly PointAttrSpec[] }) {
  return (
    <KnobRow label="carries" tip={attributesTooltip(attributes)}>
      <span className="truncate text-ink-dim">
        {attributes.length === 0 ? '(nothing but its position)' : attributes.map(labelWithUnits).join(', ')}
      </span>
    </KnobRow>
  );
}

function labelWithUnits(attr: PointAttrSpec): string {
  return attr.units ? `${attr.label} (${attr.units})` : attr.label;
}

function attributesTooltip(attributes: readonly PointAttrSpec[]): TooltipContent {
  return {
    title: 'what each point carries',
    body: 'The named numbers this node writes into every point it emits. Nodes downstream read them by name, so a point missing one falls back to a guess.',
    options: attributes.map((attr) => ({ name: labelWithUnits(attr), meaning: attr.help })),
  };
}
