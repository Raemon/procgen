import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';

const NODE_ID_MIME = 'text/procgen-node-id';

export function nodeDragHandle(): HTMLElement {
  const handle = document.createElement('span');
  handle.className = 'node-drag-handle';
  handle.textContent = '⠿';
  handle.title = 'drag to reorder';
  handle.draggable = true;
  handle.addEventListener('dragstart', startCardDrag);
  handle.addEventListener('dragend', endCardDrag);
  return handle;
}

export function enableNodeDropReorder(list: HTMLElement, store: PipelineStore): void {
  list.addEventListener('dragover', (event) => showDropTarget(event, list));
  list.addEventListener('dragleave', (event) => clearMarkersWhenLeavingList(event, list));
  list.addEventListener('drop', (event) => dropCardAtPointer(event, list, store));
}

function startCardDrag(event: DragEvent): void {
  const card = cardOf(event.currentTarget);
  if (!card || !event.dataTransfer) return;
  event.dataTransfer.setData(NODE_ID_MIME, card.dataset.nodeId ?? '');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setDragImage(card, 16, 16);
  card.classList.add('node-dragging');
}

function endCardDrag(event: DragEvent): void {
  cardOf(event.currentTarget)?.classList.remove('node-dragging');
}

function showDropTarget(event: DragEvent, list: HTMLElement): void {
  if (!event.dataTransfer?.types.includes(NODE_ID_MIME)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  markInsertionPoint(list, insertionIndexAt(list, event.clientY));
}

function dropCardAtPointer(event: DragEvent, list: HTMLElement, store: PipelineStore): void {
  const nodeId = event.dataTransfer?.getData(NODE_ID_MIME);
  if (!nodeId) return;
  event.preventDefault();
  clearInsertionMarkers(list);
  store.moveNodeToIndex(nodeId, insertionIndexAt(list, event.clientY));
}

function clearMarkersWhenLeavingList(event: DragEvent, list: HTMLElement): void {
  if (event.relatedTarget instanceof Node && list.contains(event.relatedTarget)) return;
  clearInsertionMarkers(list);
}

function insertionIndexAt(list: HTMLElement, pointerY: number): number {
  const cards = cardsIn(list);
  const firstBelow = cards.findIndex((card) => pointerY < cardMidY(card));
  return firstBelow < 0 ? cards.length : firstBelow;
}

function markInsertionPoint(list: HTMLElement, index: number): void {
  clearInsertionMarkers(list);
  const cards = cardsIn(list);
  if (index < cards.length) cards[index]!.classList.add('drop-before');
  else cards[cards.length - 1]?.classList.add('drop-after');
}

function clearInsertionMarkers(list: HTMLElement): void {
  for (const card of cardsIn(list)) card.classList.remove('drop-before', 'drop-after');
}

function cardsIn(list: HTMLElement): HTMLElement[] {
  return [...list.querySelectorAll<HTMLElement>('.node-card')];
}

function cardMidY(card: HTMLElement): number {
  const rect = card.getBoundingClientRect();
  return rect.top + rect.height / 2;
}

function cardOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof HTMLElement ? target.closest<HTMLElement>('.node-card') : null;
}
