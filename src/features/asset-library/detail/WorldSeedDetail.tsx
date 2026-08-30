import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { useRerenderOnTileAssetChange } from '@/features/app-shell/runtime/rerenderHooks';
import { AddNodeMenu } from '@/features/asset-library/detail/worldSeeds/AddNodeMenu';
import {
  EditedPipelineProvider,
  useEditedPipeline,
  useRerenderOnEditedPipelineChange,
} from '@/features/asset-library/detail/worldSeeds/editing/editedPipelineContext';
import { NodeList } from '@/features/asset-library/detail/worldSeeds/NodeList';
import { NodeListToolbar } from '@/features/asset-library/detail/worldSeeds/NodeListToolbar';
import { RandomizeRow } from '@/features/asset-library/detail/worldSeeds/RandomizeRow';
import { scrollNodeCardIntoView } from '@/features/asset-library/detail/worldSeeds/scrollNodeCardIntoView';
import { DaylightRow } from '@/features/asset-library/detail/worldSeeds/DaylightRow';
import { SeedNumberRow } from '@/features/asset-library/detail/worldSeeds/SeedNumberRow';
import { TimeRow } from '@/features/asset-library/detail/worldSeeds/TimeRow';
import type { WorldSeed } from '@/features/asset-library/worlds/seeds/worldSeed';
import { WORLD_SEED_NAME_TIP } from '../help/libraryTips';
import { useRenameWorldSeed } from '../panel/useLibraryRename';
import { useRunningWorldSeed } from '../panel/useRunningWorld';
import { DetailNameField } from './DetailNameField';
import { NothingHere } from './NothingHere';
import { WorldSeedActionsRow } from './WorldSeedActionsRow';

export function WorldSeedDetail({ name }: { name: string }) {
  const { editing, worldSeedShelf } = useAppRuntime();
  const running = useRunningWorldSeed();
  const shelf = useSyncExternalStore(
    (listener) => worldSeedShelf.onChange(listener),
    () => worldSeedShelf.all(),
  );
  const seed = shelf.find((each) => each.name === name);
  const pipeline = editing.worldSeed(name);
  if (!seed || !pipeline) return <NothingHere what="world seed" />;
  return (
    <EditedPipelineProvider pipeline={pipeline}>
      <WorldSeedEditor seed={seed} running={running === name} />
    </EditedPipelineProvider>
  );
}

function WorldSeedEditor({ seed, running }: { seed: WorldSeed; running: boolean }) {
  const { store, perform } = useEditedPipeline();
  const renameWorldSeed = useRenameWorldSeed();
  useRerenderOnEditedPipelineChange();
  useRerenderOnTileAssetChange();

  function addNodeAndReveal(type: string): void {
    const added = perform('add_node', { type });
    const node = added.ok ? store.nodes().at(-1) : undefined;
    if (node) scrollNodeCardIntoView(node.id);
  }

  return (
    <>
      <DetailNameField
        name={seed.name}
        label="world seed name"
        tip={WORLD_SEED_NAME_TIP}
        onRename={(named) => renameWorldSeed(seed.name, named)}
      />
      <WorldSeedActionsRow seed={seed} running={running} />
      <SeedNumberRow />
      <DaylightRow />
      <TimeRow />
      <RandomizeRow />
      <NodeListToolbar />
      <NodeList />
      <AddNodeMenu onPick={addNodeAndReveal} />
      <PanelHint className="mt-2">
        Every edit here is an edit to this world seed, saved as you make it — the ▶ run button is
        what grows it in the game panel, so you can open one to work on it without disturbing what
        you are looking at. Editing a seed never touches a saved world grown from it; each save
        keeps its own copy. Nodes run top to bottom: drag ⠿ to reorder, give adjacent nodes the same
        folder name to fold them into one band, and send that band to the library as a node group.
      </PanelHint>
    </>
  );
}
