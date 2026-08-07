import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnPipelineChange, useRerenderOnTilesetChange } from '../../app/rerenderHooks';
import { PanelHint } from '../help/PanelHint';
import { AddNodeMenu } from './AddNodeMenu';
import { AddTemplateMenu } from './AddTemplateMenu';
import { NodeList } from './NodeList';
import { PresetsRow } from './PresetsRow';
import { RandomizeRow } from './RandomizeRow';
import { scrollNodeCardIntoView } from './scrollNodeCardIntoView';
import { WorldSeedRow } from './WorldSeedRow';

export function ProcgenPanel() {
  const { store, perform } = useAppRuntime();
  useRerenderOnPipelineChange();
  useRerenderOnTilesetChange();

  function addNodeAndReveal(type: string): void {
    const added = perform('add_node', { type });
    const node = added.ok ? store.nodes()[store.nodes().length - 1] : undefined;
    if (node) scrollNodeCardIntoView(node.id);
  }

  return (
    <>
      <WorldSeedRow />
      <PresetsRow />
      <RandomizeRow />
      <NodeList />
      <div className="flex flex-col gap-1.5">
        <AddNodeMenu onPick={addNodeAndReveal} />
        <AddTemplateMenu onAdded={scrollNodeCardIntoView} />
      </div>
      <PanelHint>
        Nodes run top to bottom — drag ⠿ to reorder. A template stamps in a named group of nodes
        with its wiring already made; give adjacent nodes the same folder name to fold them into
        one band, and save that band back out as a template of your own. New nodes wire themselves to the nearest
        matching source; rewire with the input (←) dropdowns. Display maps a node into the world:
        tile layers stack in list order, elevation shapes the 2.5D ground, markers draw tagged
        points.
      </PanelHint>
    </>
  );
}
