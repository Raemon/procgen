import { useState, type DragEvent } from 'react';
import { useAppRuntime } from '../../../../app/appRuntimeContext';
import type { NodeInstance } from '../../../../procgen/pipeline/pipelineState';
import { Button } from '../../../../ui/controls/Button';
import { classes } from '../../../../ui/controls/classes';
import { NODE_ID_MIME } from '../nodeDragTransfer';

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
  const { store } = useAppRuntime();
  return (
    <div className={classes('flex items-center gap-[5px]', collapsed ? '' : 'mb-2')}>
      <DragHandle nodeId={node.id} />
      <button
        type="button"
        className="cursor-pointer border-none bg-transparent p-0.5 text-[11px] text-ink-dim hover:text-ink"
        title="collapse / expand"
        onClick={onToggleCollapsed}
      >
        {collapsed ? '▸' : '▾'}
      </button>
      <input
        type="checkbox"
        className="accent-accent"
        title="enabled"
        checked={node.enabled}
        onChange={(event) => store.setEnabled(node.id, event.target.checked)}
      />
      <NodeLabelInput node={node} />
      <span className="text-[10px] whitespace-nowrap text-ink-dim">{typeTitle}</span>
      <Button
        className="px-1.5 py-0.5 text-[11px]"
        title="duplicate node"
        onClick={() => store.duplicateNode(node.id)}
      >
        ⧉
      </Button>
      <Button
        className="px-1.5 py-0.5 text-[11px] hover:border-danger-edge hover:text-danger-ink"
        title="delete node"
        onClick={() => store.removeNode(node.id)}
      >
        ✕
      </Button>
    </div>
  );
}

function DragHandle({ nodeId }: { nodeId: string }) {
  return (
    <span
      draggable
      title="drag to reorder"
      className="cursor-grab px-[3px] py-0.5 text-xs text-ink-dim select-none hover:text-ink active:cursor-grabbing"
      onDragStart={(event) => startCardDrag(event, nodeId)}
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
  const { store } = useAppRuntime();
  const [draft, setDraft] = useState(node.label);
  const commit = () => draft.trim() && store.setLabel(node.id, draft.trim());
  return (
    <input
      type="text"
      className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-[3px] text-xs font-semibold text-ink hover:border-panel-edge hover:bg-bg focus:border-panel-edge focus:bg-bg"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => event.key === 'Enter' && commit()}
    />
  );
}
