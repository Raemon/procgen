import type { DragEvent } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { classes } from '../../frontend/controls/classes';
import { useRerenderOnWorldChange } from '../../frontend/rerenderHooks';
import { selects } from '../../library/librarySelection';
import { useLibrarySelection } from '../../library/useLibrarySelection';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import { nodeTypeOf } from '../nodeRegistry';
import type { NodeInstance } from '../pipeline/pipelineState';
import { DRAG_HANDLE_TIP } from './help/nodeCardTips';
import { NODE_ID_MIME } from './nodeDragTransfer';
import { DROP_INDEX_ATTRIBUTE } from './nodeInsertionIndex';
import { NodeTypeIcon } from './nodeTypeIcon';

export type DropMarker = 'before' | 'after' | null;

export function NodeRow({
  node,
  index,
  dropMarker,
}: {
  node: NodeInstance;
  index: number;
  dropMarker: DropMarker;
}) {
  const { evaluator } = useAppRuntime();
  const [selection, select] = useLibrarySelection();
  useRerenderOnWorldChange();
  const selected = selects(selection, 'pipeline', node.id);
  const typeTitle = nodeTypeOf(node.type)?.title ?? node.type;
  return (
    <div
      data-node-id={node.id}
      {...{ [DROP_INDEX_ATTRIBUTE]: index }}
      className={classes(
        'flex items-center gap-1 rounded border px-1 py-0.5',
        selected ? 'border-accent bg-btn-active' : 'border-transparent hover:bg-field',
        !node.enabled && 'opacity-45',
        dropMarkerClasses(dropMarker),
      )}
    >
      <DragHandle nodeId={node.id} />
      <button
        type="button"
        className={classes(
          'flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 border-none bg-transparent px-0.5 py-1 text-left text-xs',
          selected ? 'text-accent' : 'text-ink',
        )}
        onClick={() => select('pipeline', node.id)}
        {...tooltipHandlers({ title: node.label, body: rowSummary(node, typeTitle) })}
      >
        <NodeTypeIcon type={node.type} size={13} />
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        {evaluator.errorFor(node.id) && <span className="text-[11px] text-error-ink">!</span>}
      </button>
    </div>
  );
}

function rowSummary(node: NodeInstance, typeTitle: string): string {
  const parts = [typeTitle, `shows as ${node.display.mode}`];
  if (!node.enabled) parts.push('disabled');
  if (node.comment !== '') parts.push(node.comment);
  return parts.join(' · ');
}

function DragHandle({ nodeId }: { nodeId: string }) {
  return (
    <span
      draggable
      className="cursor-grab px-[3px] py-0.5 text-xs text-ink-dim select-none hover:text-ink active:cursor-grabbing"
      onDragStart={(event) => startRowDrag(event, nodeId)}
      {...tooltipHandlers(DRAG_HANDLE_TIP)}
    >
      ⠿
    </span>
  );
}

function startRowDrag(event: DragEvent<HTMLElement>, nodeId: string): void {
  const row = event.currentTarget.closest<HTMLElement>('[data-node-id]');
  event.dataTransfer.setData(NODE_ID_MIME, nodeId);
  event.dataTransfer.effectAllowed = 'move';
  if (row) event.dataTransfer.setDragImage(row, 16, 16);
}

function dropMarkerClasses(dropMarker: DropMarker): string | false {
  if (dropMarker === 'before') return 'shadow-[0_-4px_0_-2px_var(--color-accent)]';
  return dropMarker === 'after' && 'shadow-[0_4px_0_-2px_var(--color-accent)]';
}
