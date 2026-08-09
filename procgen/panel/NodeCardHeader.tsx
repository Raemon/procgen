import { useState } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import type { NodeInstance } from '../pipeline/pipelineState';
import { Button } from '../../frontend/controls/Button';
import { classes } from '../../frontend/controls/classes';
import { REVEALED_ON_ROW_HOVER } from '../../frontend/controls/revealOnRowHover';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import {
  deleteNodeTip,
  duplicateNodeTip,
  NODE_LABEL_TIP,
  nodeEnabledTip,
  nodeTypeTip,
} from './help/nodeCardTips';
import { NodeTypeIcon } from './nodeTypeIcon';

export function NodeCardHeader({ node, typeTitle }: { node: NodeInstance; typeTitle: string }) {
  const { perform } = useAppRuntime();
  return (
    <div className="mb-2 flex items-center gap-[5px]">
      <span className="p-1 text-ink-dim" {...tooltipHandlers(nodeTypeTip(node, typeTitle))}>
        <NodeTypeIcon type={node.type} size={16} />
      </span>
      <input
        type="checkbox"
        className="accent-accent"
        aria-label="enabled"
        checked={node.enabled}
        onChange={(event) =>
          perform(event.target.checked ? 'enable_node' : 'disable_node', { node_id: node.id })
        }
        {...tooltipHandlers(nodeEnabledTip(node))}
      />
      <NodeLabelInput node={node} />
      <Button
        className={classes(REVEALED_ON_ROW_HOVER, 'px-1.5 py-0.5 text-[11px]')}
        tip={duplicateNodeTip(node)}
        onClick={() => perform('duplicate_node', { node_id: node.id })}
      >
        ⧉
      </Button>
      <Button
        className={classes(
          REVEALED_ON_ROW_HOVER,
          'px-1.5 py-0.5 text-[11px] hover:border-danger-edge hover:text-danger-ink',
        )}
        tip={deleteNodeTip(node)}
        onClick={() => perform('remove_node', { node_id: node.id })}
      >
        ✕
      </Button>
    </div>
  );
}

function NodeLabelInput({ node }: { node: NodeInstance }) {
  const { perform } = useAppRuntime();
  const [draft, setDraft] = useState(node.label);
  const commit = () => draft.trim() && perform('rename_node', { node_id: node.id, label: draft.trim() });
  return (
    <input
      type="text"
      className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-[3px] text-xs font-semibold text-ink hover:border-panel-edge hover:bg-bg focus:border-panel-edge focus:bg-bg"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => event.key === 'Enter' && commit()}
      aria-label="node label"
      {...tooltipHandlers(NODE_LABEL_TIP)}
    />
  );
}
