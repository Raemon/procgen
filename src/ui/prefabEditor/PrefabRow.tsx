import { useAppRuntime } from '../../app/appRuntimeContext';
import type { Prefab } from '../../prefabs/prefabDef';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import { PrefabEditorBody } from './PrefabEditorBody';

export function PrefabRow({
  prefab,
  open,
  onToggle,
}: {
  prefab: Prefab;
  open: boolean;
  onToggle(): void;
}) {
  const { prefabs } = useAppRuntime();
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          title="name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={prefab.name}
          onChange={(event) => prefabs.update(prefab.id, { name: event.target.value })}
        />
        <span className="shrink-0 text-[11px] whitespace-nowrap text-ink-dim">
          {prefab.width}×{prefab.depth}×{prefab.layers}
        </span>
        <Button
          className="px-2 py-0.5"
          title="edit voxels"
          active={open}
          onClick={onToggle}
        >
          3D
        </Button>
        <Button
          className="px-2 py-0.5"
          title="duplicate prefab"
          onClick={() => prefabs.duplicate(prefab.id)}
        >
          ⧉
        </Button>
        <Button
          className="px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink"
          title="delete prefab"
          onClick={() => prefabs.remove(prefab.id)}
        >
          ×
        </Button>
      </div>
      {open && <PrefabEditorBody prefab={prefab} />}
    </div>
  );
}
