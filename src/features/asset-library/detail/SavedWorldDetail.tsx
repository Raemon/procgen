import { useState, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { classes } from '@/features/app-shell/controls/classes';
import { DIM_READOUT_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import type { SavedWorld } from '@/features/asset-library/worlds/saved/savedWorld';
import { deleteRowConfirmation } from '../help/rowActionTips';
import { useLibrarySelection } from '../panel/useLibrarySelection';
import { useRunningSavedWorld } from '../panel/useRunningWorld';
import { NothingHere } from './NothingHere';

export function SavedWorldDetail({ name }: { name: string }) {
  const { savedWorlds } = useAppRuntime();
  const running = useRunningSavedWorld();
  const kept = useSyncExternalStore(
    (listener) => savedWorlds.onChange(listener),
    () => savedWorlds.all(),
  );
  const saved = kept.find((each) => each.name === name);
  if (!saved) return <NothingHere what="saved world" />;
  return <SavedWorldSheet saved={saved} running={running === name} />;
}

function SavedWorldSheet({ saved, running }: { saved: SavedWorld; running: boolean }) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisSave(): void {
    setConfirmingDelete(false);
    perform('delete_saved_world', { name: saved.name });
    clear();
  }

  return (
    <>
      <h3 className="mb-1 text-sm text-ink">{saved.name}</h3>
      <div className="mb-2 flex gap-1.5">
        <Button
          className="flex-1"
          active={running}
          tip={{
            title: running ? `${saved.name} is running` : `resume ${saved.name}`,
            body: 'Puts this saved world back in the game panel, everything you did there already applied.',
          }}
          onClick={() => perform('run_saved_world', { name: saved.name })}
        >
          {running ? '▶ running' : '▶ run'}
        </Button>
        <Button
          tip={{
            title: `duplicate ${saved.name}`,
            body: 'Files a second copy of this save, so you can carry on from the same point twice.',
          }}
          onClick={() => perform('duplicate_saved_world', { name: saved.name })}
        >
          ⧉
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={{
            title: `delete ${saved.name}`,
            body: 'Drops this save. The world seed it grew from stays in the library.',
          }}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      <WhatHappenedHere saved={saved} />
      <PanelHint className="mt-2">
        A saved world is the seed frozen as it was plus everything you have done in it. While this
        save is the one running, every pickup, fixture and step writes itself back here — so the
        library row is always where you actually are. Edit the world seed it names to change what a
        fresh world grows into; this save keeps its own copy either way.
      </PanelHint>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(saved.name)}
          onConfirm={deleteThisSave}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}

function WhatHappenedHere({ saved }: { saved: SavedWorld }) {
  const rows: [string, string][] = [
    ...(saved.description ? ([['what happened', saved.description]] as [string, string][]) : []),
    ['grown from', saved.seededBy || 'a seed no longer in the library'],
    ['seed number', String(saved.state.seed)],
    ['player', `(${saved.player.x}, ${saved.player.y}) facing ${saved.player.facing}`],
    ['items taken', String(saved.takenItems.length)],
    ['fixtures worked', String(saved.puzzles.on.length)],
    ['crates moved', String(saved.puzzles.crates.length)],
  ];
  return (
    <dl className={classes(DIM_READOUT_CLASSES, 'mb-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5')}>
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt>{label}</dt>
          <dd className="text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
