import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { Button } from '../../../frontend/controls/Button';
import { classes } from '../../../frontend/controls/classes';
import { HINT_CLASSES } from '../../../frontend/controls/fieldClasses';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { exampleWorlds } from '../../exampleWorlds';
import { deleteWorldTip, loadWorldTip } from '../../help/libraryTips';
import { WORLD_SELECTED } from '../../librarySelection';
import { useLibrarySelection } from '../useLibrarySelection';
import type { StoredWorldKey } from '../../worldKeys';
import { NodeBandSummary } from './NodeBandSummary';
import { NothingHere } from './NothingHere';

export function StoredWorldDetail({ world }: { world: StoredWorldKey }) {
  const { worldPresets, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  const saved = useSyncExternalStore(
    (listener) => worldPresets.onChange(listener),
    () => worldPresets.savedPresets(),
  );
  const stored = world.saved
    ? saved.find((preset) => preset.name === world.name)
    : exampleWorlds().find((example) => example.name === world.name);
  if (!stored) return <NothingHere what="world" />;

  function backToTheWorldBeingEdited(): void {
    select(WORLD_SELECTED.folder, WORLD_SELECTED.key);
  }

  function loadIntoTheEditor(): void {
    if (!window.confirm('Replace the current pipeline?')) return;
    perform('load_preset', { name: world.name });
    backToTheWorldBeingEdited();
  }

  function deleteThisWorld(): void {
    if (!window.confirm(`Delete your saved world "${world.name}"?`)) return;
    perform('delete_preset', { name: world.name });
    backToTheWorldBeingEdited();
  }

  return (
    <>
      <h3 className="mb-1 text-sm text-ink">{stored.name}</h3>
      <p className={classes(HINT_CLASSES, 'mb-2')}>{stored.description}</p>
      <NodeBandSummary nodes={stored.state.nodes} />
      <div className="mt-2 flex gap-1.5">
        <Button className="flex-1" tip={loadWorldTip(stored.name)} onClick={loadIntoTheEditor}>
          load into this world
        </Button>
        {world.saved && (
          <Button
            className="hover:border-danger-edge hover:text-danger-ink"
            tip={deleteWorldTip(stored.name)}
            onClick={deleteThisWorld}
          >
            ✕
          </Button>
        )}
      </div>
      <PanelHint className="mt-2">
        Loading replaces every node in this world with this one — assets are untouched, since nodes
        reference them by id. To keep the world you have now, save it first from the world you are
        editing.
      </PanelHint>
    </>
  );
}
