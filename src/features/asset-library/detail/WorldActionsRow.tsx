import { useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { classes } from '@/features/app-shell/controls/classes';
import { HINT_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import type { WorldPreset } from '@/features/asset-library/worlds/presets/worldPreset';
import { deleteRowConfirmation } from '../help/rowActionTips';
import { copyWorldTip, deleteWorldTip, runWorldTip } from '../help/libraryTips';
import { worldThumbnails } from '../worldThumbnails';
import { useLibrarySelection } from '../panel/useLibrarySelection';

export function WorldActionsRow({ world, running }: { world: WorldPreset; running: boolean }) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisWorld(): void {
    setConfirmingDelete(false);
    perform('delete_preset', { name: world.name });
    worldThumbnails.forget(world.name);
    clear();
  }

  return (
    <>
      <p className={classes(HINT_CLASSES, 'mb-2')}>{world.description}</p>
      <div className="mb-2 flex gap-1.5">
        <Button
          className="flex-1"
          active={running}
          tip={runWorldTip(world.name, running)}
          onClick={() => perform('run_world', { name: world.name })}
        >
          {running ? '▶ running' : '▶ run'}
        </Button>
        <Button tip={copyWorldTip(world.name)} onClick={() => perform('duplicate_preset', { name: world.name })}>
          ⧉
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={deleteWorldTip(world.name)}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(world.name)}
          onConfirm={deleteThisWorld}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
