import { useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { classes } from '@/features/app-shell/controls/classes';
import { HINT_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import type { WorldSeed } from '@/features/asset-library/worlds/seeds/worldSeed';
import { deleteRowConfirmation } from '../help/rowActionTips';
import { copyWorldSeedTip, deleteWorldSeedTip, runWorldSeedTip } from '../help/libraryTips';
import { worldSeedThumbnails } from '../worldSeedThumbnails';
import { useLibrarySelection } from '../panel/useLibrarySelection';

export function WorldSeedActionsRow({ seed, running }: { seed: WorldSeed; running: boolean }) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisWorldSeed(): void {
    setConfirmingDelete(false);
    perform('delete_world_seed', { name: seed.name });
    worldSeedThumbnails.forget(seed.name);
    clear();
  }

  return (
    <>
      <p className={classes(HINT_CLASSES, 'mb-2')}>{seed.description}</p>
      <div className="mb-2 flex gap-1.5">
        <Button
          className="flex-1"
          active={running}
          tip={runWorldSeedTip(seed.name, running)}
          onClick={() => perform('run_world_seed', { name: seed.name })}
        >
          {running ? '▶ running' : '▶ run'}
        </Button>
        <Button tip={copyWorldSeedTip(seed.name)} onClick={() => perform('duplicate_world_seed', { name: seed.name })}>
          ⧉
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={deleteWorldSeedTip(seed.name)}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(seed.name)}
          onConfirm={deleteThisWorldSeed}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
