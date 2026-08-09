import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { useRerenderOnTileAssetChange } from '../../../frontend/rerenderHooks';
import { AddNodeMenu } from '../../../procgen/panel/AddNodeMenu';
import {
  EditedPipelineProvider,
  useEditedPipeline,
  useRerenderOnEditedPipelineChange,
} from '../../../procgen/panel/editing/editedPipelineContext';
import { NodeList } from '../../../procgen/panel/NodeList';
import { NodeListToolbar } from '../../../procgen/panel/NodeListToolbar';
import { RandomizeRow } from '../../../procgen/panel/RandomizeRow';
import { scrollNodeCardIntoView } from '../../../procgen/panel/scrollNodeCardIntoView';
import { WorldDaylightRow } from '../../../procgen/panel/WorldDaylightRow';
import { WorldSeedRow } from '../../../procgen/panel/WorldSeedRow';
import type { WorldPreset } from '../../../procgen/presets/worldPreset';
import { useRunningWorld } from '../useRunningWorld';
import { NothingHere } from './NothingHere';
import { WorldActionsRow } from './WorldActionsRow';

export function WorldDetail({ name }: { name: string }) {
  const { editing, worlds } = useAppRuntime();
  const running = useRunningWorld();
  const shelf = useSyncExternalStore(
    (listener) => worlds.onChange(listener),
    () => worlds.all(),
  );
  const world = shelf.find((each) => each.name === name);
  const pipeline = editing.world(name);
  if (!world || !pipeline) return <NothingHere what="world" />;
  return (
    <EditedPipelineProvider pipeline={pipeline}>
      <WorldEditor world={world} running={running === name} />
    </EditedPipelineProvider>
  );
}

function WorldEditor({ world, running }: { world: WorldPreset; running: boolean }) {
  const { store, perform } = useEditedPipeline();
  useRerenderOnEditedPipelineChange();
  useRerenderOnTileAssetChange();

  function addNodeAndReveal(type: string): void {
    const added = perform('add_node', { type });
    const node = added.ok ? store.nodes().at(-1) : undefined;
    if (node) scrollNodeCardIntoView(node.id);
  }

  return (
    <>
      <h3 className="mb-1 text-sm text-ink">{world.name}</h3>
      <WorldActionsRow world={world} running={running} />
      <WorldSeedRow />
      <WorldDaylightRow />
      <RandomizeRow />
      <NodeListToolbar />
      <NodeList />
      <AddNodeMenu onPick={addNodeAndReveal} />
      <PanelHint className="mt-2">
        Every edit here is an edit to this world, saved as you make it — the ▶ run button is what
        puts a world in the game panel, so you can open one to work on it without disturbing what you
        are looking at. Nodes run top to bottom: drag ⠿ to reorder, give adjacent nodes the same
        folder name to fold them into one band, and send that band to the library as a node group.
      </PanelHint>
    </>
  );
}
