import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { Button } from '@/features/app-shell/controls/Button';
import { scrollNodeCardIntoView } from '@/features/asset-library/detail/worldSeeds/scrollNodeCardIntoView';
import { forgetGroupTip, stampGroupTip } from '../help/libraryTips';
import { useLibrarySelection } from '../panel/useLibrarySelection';
import { useRunningWorldName } from '../panel/useRunningWorld';

export function NodeGroupActionsRow({ name }: { name: string }) {
  const { templates, store, perform, runningWorld } = useAppRuntime();
  const { select } = useLibrarySelection();
  const running = useRunningWorldName();
  const saved = useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.savedTemplates(),
  );

  function stampIntoTheRunningWorld(): void {
    const before = store.nodes().map((node) => node.id);
    perform('stamp_template', { name });
    const ref = runningWorld.ref();
    if (ref) select(ref.kind === 'saved' ? 'savedWorlds' : 'worldSeeds', ref.name);
    const added = store.nodes().find((node) => !before.includes(node.id));
    if (added) scrollNodeCardIntoView(added.id);
  }

  return (
    <div className="mb-2 flex gap-1.5">
      <Button
        className="flex-1"
        disabled={!running}
        tip={stampGroupTip(name, running)}
        onClick={stampIntoTheRunningWorld}
      >
        {running ? `stamp into ${running}` : 'no world is running'}
      </Button>
      {saved.some((each) => each.name === name) && (
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={forgetGroupTip(name)}
          onClick={() => perform('delete_template', { name })}
        >
          ✕
        </Button>
      )}
    </div>
  );
}
