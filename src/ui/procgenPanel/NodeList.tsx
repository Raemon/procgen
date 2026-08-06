import { useRef, useState, type DragEvent } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { insertionIndexAt } from './nodeInsertionIndex';
import { carriesNodeId, draggedNodeId } from './nodeDragTransfer';
import { NodeCard, type DropMarker } from './NodeCard';

export function NodeList() {
  const { store } = useAppRuntime();
  const list = useRef<HTMLDivElement>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const nodes = store.nodes();

  function showDropTarget(event: DragEvent<HTMLDivElement>): void {
    if (!carriesNodeId(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropIndex(insertionIndexAt(list.current, event.clientY));
  }

  function dropCard(event: DragEvent<HTMLDivElement>): void {
    const nodeId = draggedNodeId(event.dataTransfer);
    if (!nodeId) return;
    event.preventDefault();
    setDropIndex(null);
    store.moveNodeToIndex(nodeId, insertionIndexAt(list.current, event.clientY));
  }

  return (
    <div
      ref={list}
      className="my-3 flex flex-col gap-2.5"
      onDragOver={showDropTarget}
      onDragLeave={(event) => clearMarkerWhenLeavingList(event, list.current, setDropIndex)}
      onDrop={dropCard}
    >
      {nodes.map((node, index) => (
        <NodeCard
          key={node.id}
          node={node}
          dropMarker={dropMarkerFor(index, nodes.length, dropIndex)}
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
