import { useRef, useState, type DragEvent } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { PERSISTED_UI_KEYS } from '../uiState/persistedUiKeys';
import { usePersistedUiSet } from '../uiState/usePersistedUiSet';
import { DROP_INDEX_ATTRIBUTE, insertionIndexAt } from './nodeInsertionIndex';
import { carriesNodeId, draggedNodeId } from './nodeDragTransfer';
import { NodeCard, type DropMarker } from './NodeCard';
import { NodeFolderBand } from './NodeFolderBand';
import { nodeFolderRuns, type NodeRun } from './nodeFolderRuns';

export function NodeList() {
  const { store, perform } = useAppRuntime();
  const list = useRef<HTMLDivElement>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const collapsedFolders = usePersistedUiSet(PERSISTED_UI_KEYS.collapsedNodeFolders);
  const nodes = store.nodes();
  const runs = nodeFolderRuns(nodes);

  function showDropTarget(event: DragEvent<HTMLDivElement>): void {
    if (!carriesNodeId(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropIndex(insertionIndexAt(list.current, event.clientY, nodes.length));
  }

  function dropCard(event: DragEvent<HTMLDivElement>): void {
    const nodeId = draggedNodeId(event.dataTransfer);
    if (!nodeId) return;
    event.preventDefault();
    setDropIndex(null);
    perform('move_node', { node_id: nodeId, before_node_id: nodes[insertionIndexAt(list.current, event.clientY, nodes.length)]?.id });
  }

  return (
    <div
      ref={list}
      className="my-3 flex flex-col gap-2.5"
      onDragOver={showDropTarget}
      onDragLeave={(event) => clearMarkerWhenLeavingList(event, list.current, setDropIndex)}
      onDrop={dropCard}
    >
      {runs.map((run) => (
        <RunView
          key={`${run.folder}@${run.startIndex}`}
          run={run}
          nodeCount={nodes.length}
          dropIndex={dropIndex}
          collapsed={collapsedFolders.has(run.folder)}
          onToggleCollapsed={() => collapsedFolders.toggle(run.folder)}
        />
      ))}
      {nodes.length === 0 && (
        <p className={HINT_CLASSES}>
          Blank world. Add a node to start generating, or load an example.
        </p>
      )}
    </div>
  );
}

function RunView({
  run,
  nodeCount,
  dropIndex,
  collapsed,
  onToggleCollapsed,
}: {
  run: NodeRun;
  nodeCount: number;
  dropIndex: number | null;
  collapsed: boolean;
  onToggleCollapsed(): void;
}) {
  if (run.folder === '') {
    return <CardInRun run={run} offset={0} nodeCount={nodeCount} dropIndex={dropIndex} />;
  }
  return (
    <div {...(collapsed ? { [DROP_INDEX_ATTRIBUTE]: run.startIndex } : {})}>
      <NodeFolderBand run={run} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed}>
        {run.nodes.map((_, offset) => (
          <CardInRun
            key={run.nodes[offset]!.id}
            run={run}
            offset={offset}
            nodeCount={nodeCount}
            dropIndex={dropIndex}
          />
        ))}
      </NodeFolderBand>
    </div>
  );
}

function CardInRun({
  run,
  offset,
  nodeCount,
  dropIndex,
}: {
  run: NodeRun;
  offset: number;
  nodeCount: number;
  dropIndex: number | null;
}) {
  const index = run.startIndex + offset;
  return (
    <NodeCard
      node={run.nodes[offset]!}
      index={index}
      dropMarker={dropMarkerFor(index, nodeCount, dropIndex)}
    />
  );
}

function clearMarkerWhenLeavingList(
  event: DragEvent<HTMLDivElement>,
  list: HTMLElement | null,
  setDropIndex: (index: number | null) => void,
): void {
  const leavingTo = event.relatedTarget;
  if (leavingTo instanceof Node && list?.contains(leavingTo)) return;
  setDropIndex(null);
}

function dropMarkerFor(index: number, nodeCount: number, dropIndex: number | null): DropMarker {
  if (dropIndex === null) return null;
  if (dropIndex === index) return 'before';
  return dropIndex >= nodeCount && index === nodeCount - 1 ? 'after' : null;
}
