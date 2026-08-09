import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { PanelHint } from '../../frontend/help/PanelHint';
import { useRerenderOnPipelineChange } from '../../frontend/rerenderHooks';
import { NodeCard } from '../../procgen/panel/NodeCard';
import { NothingHere } from './NothingHere';

export function NodeDetail({ nodeId }: { nodeId: string }) {
  const { store } = useAppRuntime();
  useRerenderOnPipelineChange();
  const node = store.nodes().find((each) => each.id === nodeId);
  if (!node) return <NothingHere what="node" />;
  return (
    <>
      <NodeCard key={node.id} node={node} />
      <PanelHint className="mt-2">
        Nodes run top to bottom, so this one only sees what the nodes above it produced. Its inputs
        (←) choose those sources, and display decides what reaches the map: tile layers stack in
        list order, elevation shapes the 2.5D ground, markers draw tagged points.
      </PanelHint>
    </>
  );
}
