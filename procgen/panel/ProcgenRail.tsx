import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { useRerenderOnPipelineChange } from '../../frontend/rerenderHooks';
import { nodeTypeOf } from '../nodeRegistry';
import type { NodeInstance } from '../pipeline/pipelineState';
import { RailItem, RailStack } from '../../frontend/collapsedRail/RailItem';
import type { TooltipContent } from '../../frontend/tooltips/tooltipContent';
import { NodeTypeIcon } from './nodeTypeIcon';

export function ProcgenRail() {
  const { store } = useAppRuntime();
  useRerenderOnPipelineChange();
  return (
    <RailStack>
      {store.nodes().map((node) => (
        <RailItem key={node.id} tip={nodeRailTip(node)} dimmed={!node.enabled}>
          <NodeTypeIcon type={node.type} size={12} />
        </RailItem>
      ))}
    </RailStack>
  );
}

function nodeRailTip(node: NodeInstance): TooltipContent {
  const typeTitle = nodeTypeOf(node.type)?.title ?? node.type;
  return {
    title: node.label === '' ? typeTitle : node.label,
    body: nodeRailSummary(node, typeTitle),
  };
}

function nodeRailSummary(node: NodeInstance, typeTitle: string): string {
  const parts = [typeTitle, `shows as ${node.display.mode}`];
  if (node.folder !== '') parts.push(`in ${node.folder}`);
  if (!node.enabled) parts.push('disabled');
  if (node.comment !== '') parts.push(node.comment);
  return parts.join(' · ');
}
