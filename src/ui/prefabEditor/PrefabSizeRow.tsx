import { MAX_PREFAB_LAYERS, MAX_PREFAB_SIDE, type Prefab } from '../../prefabs/prefabDef';
import { classes } from '../controls/classes';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { SIZE_TIPS } from './help/prefabTips';
import type { PrefabEditor } from './usePrefabEditor';

export function PrefabSizeRow({ editor }: { editor: PrefabEditor }) {
  const { prefab } = editor;
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-dim">
      <span>size</span>
      <SizeField
        tip={SIZE_TIPS.width}
        value={prefab.width}
        max={MAX_PREFAB_SIDE}
        onChange={(width) => editor.resize(extentWith(prefab, { width }))}
      />
      <span>×</span>
      <SizeField
        tip={SIZE_TIPS.depth}
        value={prefab.depth}
        max={MAX_PREFAB_SIDE}
        onChange={(depth) => editor.resize(extentWith(prefab, { depth }))}
      />
      <span>×</span>
      <SizeField
        tip={SIZE_TIPS.layers}
        value={prefab.layers}
        max={MAX_PREFAB_LAYERS}
        onChange={(layers) => editor.resize(extentWith(prefab, { layers }))}
      />
    </div>
  );
}

function extentWith(prefab: Prefab, patch: Partial<{ width: number; depth: number; layers: number }>) {
  return { width: prefab.width, depth: prefab.depth, layers: prefab.layers, ...patch };
}

function SizeField({
  tip,
  value,
  max,
  onChange,
}: {
  tip: TooltipContent;
  value: number;
  max: number;
  onChange(value: number): void;
}) {
  return (
    <input
      type="number"
      min={1}
      max={max}
      aria-label={tip.title}
      className={classes(FIELD_CLASSES, 'w-12')}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      {...tooltipHandlers(tip)}
    />
  );
}
