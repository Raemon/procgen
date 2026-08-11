import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { useRerenderOnTileAssetChange } from '@/features/app-shell/runtime/rerenderHooks';
import { AddNodeMenu } from '@/features/asset-library/detail/worlds/AddNodeMenu';
import {
  EditedPipelineProvider,
  useEditedPipeline,
  useRerenderOnEditedPipelineChange,
} from '@/features/asset-library/detail/worlds/editing/editedPipelineContext';
import { NodeList } from '@/features/asset-library/detail/worlds/NodeList';
import { NodeListToolbar } from '@/features/asset-library/detail/worlds/NodeListToolbar';
import { RandomizeRow } from '@/features/asset-library/detail/worlds/RandomizeRow';
import { scrollNodeCardIntoView } from '@/features/asset-library/detail/worlds/scrollNodeCardIntoView';
import { WorldDaylightRow } from '@/features/asset-library/detail/worlds/WorldDaylightRow';
import { WorldSeedRow } from '@/features/asset-library/detail/worlds/WorldSeedRow';
import { WorldTimeRow } from '@/features/asset-library/detail/worlds/WorldTimeRow';
import type { WorldPreset } from '@/features/asset-library/worlds/presets/worldPreset';
import { useRunningWorld } from '../panel/useRunningWorld';
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
      <WorldTimeRow />
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
