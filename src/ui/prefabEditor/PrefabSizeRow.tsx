import { MAX_PREFAB_LAYERS, MAX_PREFAB_SIDE, type Prefab } from '../../prefabs/prefabDef';
import { classes } from '../controls/classes';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import type { PrefabEditor } from './usePrefabEditor';

export function PrefabSizeRow({ editor }: { editor: PrefabEditor }) {
  const { prefab } = editor;
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-dim">
      <span>size</span>
      <SizeField
        title="width (east–west)"
        value={prefab.width}
        max={MAX_PREFAB_SIDE}
        onChange={(width) => editor.resize(extentWith(prefab, { width }))}
      />
      <span>×</span>
      <SizeField
        title="depth (north–south)"
        value={prefab.depth}
        max={MAX_PREFAB_SIDE}
        onChange={(depth) => editor.resize(extentWith(prefab, { depth }))}
      />
      <span>×</span>
      <SizeField
        title="layers (height)"
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
  title,
  value,
  max,
  onChange,
}: {
  title: string;
  value: number;
  max: number;
  onChange(value: number): void;
}) {
  return (
    <input
      type="number"
      min={1}
      max={max}
      title={title}
      className={classes(FIELD_CLASSES, 'w-12')}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
