import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { Prefab } from '../prefabDef';
import { Button } from '../../../frontend/controls/Button';
import { classes } from '../../../frontend/controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '../../../frontend/controls/revealOnRowHover';
import { FIELD_CLASSES } from '../../../frontend/controls/fieldClasses';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import {
  deletePrefabTip,
  duplicatePrefabTip,
  editPrefabTip,
  PREFAB_NAME_TIP,
} from './help/prefabTips';
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
  const { perform } = useAppRuntime();
  return (
    <div className="mb-1.5">
      <div className={classes(ROW_HOVER_GROUP, 'flex items-center gap-1.5')}>
        <input
          type="text"
          aria-label="prefab name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={prefab.name}
          onChange={(event) => perform('rename_prefab', { prefab_id: prefab.id, name: event.target.value })}
          {...tooltipHandlers(PREFAB_NAME_TIP)}
        />
        <span className="shrink-0 text-[11px] whitespace-nowrap text-ink-dim">
          {prefab.width}×{prefab.depth}×{prefab.layers}
        </span>
        <Button
          className="px-2 py-0.5"
          tip={editPrefabTip(open)}
          active={open}
          onClick={onToggle}
        >
          3D
        </Button>
        <Button
          className={classes(REVEALED_ON_ROW_HOVER, 'px-2 py-0.5')}
          tip={duplicatePrefabTip(prefab)}
          onClick={() => perform('duplicate_prefab', { prefab_id: prefab.id })}
        >
          ⧉
        </Button>
        <Button
          className={classes(
            REVEALED_ON_ROW_HOVER,
            'px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink',
          )}
          tip={deletePrefabTip(prefab)}
          onClick={() => perform('remove_prefab', { prefab_id: prefab.id })}
        >
          ×
        </Button>
      </div>
      {open && <PrefabEditorBody prefab={prefab} />}
    </div>
  );
}
