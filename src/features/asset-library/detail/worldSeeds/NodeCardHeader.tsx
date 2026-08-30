import { useState, type DragEvent } from 'react';
import { useEditedPipeline } from './editing/editedPipelineContext';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { Button } from '@/features/app-shell/controls/Button';
import { classes } from '@/features/app-shell/controls/classes';
import { REVEALED_ON_ROW_HOVER } from '@/features/app-shell/controls/revealOnRowHover';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import {
  collapseCardTip,
  deleteNodeTip,
  DRAG_HANDLE_TIP,
  duplicateNodeTip,
  NODE_LABEL_TIP,
  nodeEnabledTip,
} from './help/nodeCardTips';
import { NodeFolderMenu } from './NodeFolderMenu';
import { NODE_ID_MIME } from './nodeDragTransfer';
import { NodeTypeIcon } from './nodeTypeIcon';

export function NodeCardHeader({
  node,
  typeTitle,
  collapsed,
  onToggleCollapsed,
}: {
  node: NodeInstance;
  typeTitle: string;
  collapsed: boolean;
  onToggleCollapsed(): void;
}) {
  const { perform } = useEditedPipeline();
  if (collapsed) {
    return (
      <div className="flex items-center gap-[5px]">
        <DragHandle nodeId={node.id} />
        <TypeIconButton
          node={node}
          typeTitle={typeTitle}
          collapsed
          onToggleCollapsed={onToggleCollapsed}
        />
      </div>
    );
  }
  return (
    <div className="mb-2 flex items-center gap-[5px]">
      <DragHandle nodeId={node.id} />
      <TypeIconButton
        node={node}
        typeTitle={typeTitle}
        collapsed={false}
        onToggleCollapsed={onToggleCollapsed}
      />
      <input
        type="checkbox"
        className="accent-accent"
        aria-label="enabled"
        checked={node.enabled}
        onChange={(event) => perform(event.target.checked ? 'enable_node' : 'disable_node', { node_id: node.id })}
        {...tooltipHandlers(nodeEnabledTip(node))}
      />
      <NodeLabelInput node={node} />
      <NodeFolderMenu node={node} />
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

function TypeIconButton({
  node,
  typeTitle,
  collapsed,
  onToggleCollapsed,
}: {
  node: NodeInstance;
  typeTitle: string;
  collapsed: boolean;
  onToggleCollapsed(): void;
}) {
  return (
    <button
      type="button"
      className={classes(
        'cursor-pointer rounded border border-transparent p-1 hover:border-panel-edge hover:text-ink',
        collapsed ? 'text-ink' : 'text-ink-dim',
      )}
      aria-label={`${node.label} · ${typeTitle}`}
      onClick={onToggleCollapsed}
      {...tooltipHandlers(collapseCardTip(node, typeTitle))}
    >
      <NodeTypeIcon type={node.type} size={16} />
    </button>
  );
}

function DragHandle({ nodeId }: { nodeId: string }) {
  return (
    <span
      draggable
      className="cursor-grab px-[3px] py-0.5 text-xs text-ink-dim select-none hover:text-ink active:cursor-grabbing"
      onDragStart={(event) => startCardDrag(event, nodeId)}
      {...tooltipHandlers(DRAG_HANDLE_TIP)}
    >
      ⠿
    </span>
  );
}

function startCardDrag(event: DragEvent<HTMLElement>, nodeId: string): void {
  const card = event.currentTarget.closest<HTMLElement>('[data-node-id]');
  event.dataTransfer.setData(NODE_ID_MIME, nodeId);
  event.dataTransfer.effectAllowed = 'move';
  if (card) event.dataTransfer.setDragImage(card, 16, 16);
}

function NodeLabelInput({ node }: { node: NodeInstance }) {
  const { perform } = useEditedPipeline();
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
