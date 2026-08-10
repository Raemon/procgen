import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnPipelineChange, useRerenderOnTileAssetChange } from '../../../frontend/rerenderHooks';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { AddNodeMenu } from '../../../procgen/panel/AddNodeMenu';
import { NodeList } from '../../../procgen/panel/NodeList';
import { NodeListToolbar } from '../../../procgen/panel/NodeListToolbar';
import { PresetsRow } from '../../../procgen/panel/PresetsRow';
import { RandomizeRow } from '../../../procgen/panel/RandomizeRow';
import { scrollNodeCardIntoView } from '../../../procgen/panel/scrollNodeCardIntoView';
import { WorldDaylightRow } from '../../../procgen/panel/WorldDaylightRow';
import { WorldSeedRow } from '../../../procgen/panel/WorldSeedRow';
import { WorldTimeRow } from '../../../procgen/panel/WorldTimeRow';

export function CurrentWorldDetail() {
  const { store, perform } = useAppRuntime();
  useRerenderOnPipelineChange();
  useRerenderOnTileAssetChange();

  function addNodeAndReveal(type: string): void {
    const added = perform('add_node', { type });
    const node = added.ok ? store.nodes().at(-1) : undefined;
    if (node) scrollNodeCardIntoView(node.id);
  }

  return (
    <>
      <WorldSeedRow />
      <WorldDaylightRow />
      <WorldTimeRow />
      <PresetsRow />
      <RandomizeRow />
      <NodeListToolbar />
      <NodeList />
      <AddNodeMenu onPick={addNodeAndReveal} />
      <PanelHint className="mt-2">
        Nodes run top to bottom — drag ⠿ to reorder. Give adjacent nodes the same folder name to
        fold them into one band, and send that band to the asset library as a node group you can
        stamp into any world. Display maps a node into the world: tile layers stack in list order,
        elevation shapes the 2.5D ground, markers draw tagged points.
      </PanelHint>
    </>
  );
}
