import { useRef } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnPipelineChange, useRerenderOnTilesetChange } from '../../app/rerenderHooks';
import { RandomizeHistory } from './randomize/randomizeHistory';
import { HINT_CLASSES, PANEL_HEADING_CLASSES } from '../../ui/controls/fieldClasses';
import { AddNodeMenu } from './addNode/AddNodeMenu';
import { NodeList } from './nodeList/NodeList';
import { PresetsRow } from './presets/PresetsRow';
import { RandomizeRow } from './randomize/RandomizeRow';
import { scrollNodeCardIntoView } from './nodeList/scrollNodeCardIntoView';
import { WorldSeedRow } from './worldSeed/WorldSeedRow';

export function ProcgenPanel() {
  const { store } = useAppRuntime();
  const randomizeHistory = useRef(new RandomizeHistory());
  useRerenderOnPipelineChange();
  useRerenderOnTilesetChange();

  function addNodeAndReveal(type: string): void {
    const node = store.addNode(type);
    if (node) scrollNodeCardIntoView(node.id);
  }

  return (
    <>
      <h2 className={PANEL_HEADING_CLASSES}>procgen</h2>
      <WorldSeedRow />
      <PresetsRow />
      <RandomizeRow history={randomizeHistory.current} />
      <NodeList />
      <AddNodeMenu onPick={addNodeAndReveal} />
      <p className={HINT_CLASSES}>
        Nodes run top to bottom — drag ⠿ to reorder. New nodes wire themselves to the nearest
        matching source; rewire with the input (←) dropdowns. Display maps a node into the world:
        tile layers stack in list order, elevation shapes the 2.5D ground, markers draw tagged
        points.
      </p>
    </>
  );
}
