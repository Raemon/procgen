import { ChangeNotifier } from '../../frontend/changeNotifier';

let highlightedNodeId: string | null = null;
const changed = new ChangeNotifier();

export const subscribeToWireHighlight = changed.subscribe;

export function highlightedWireSource(): string | null {
  return highlightedNodeId;
}

export function highlightWireSource(nodeId: string | null): void {
  if (highlightedNodeId === nodeId) return;
  highlightedNodeId = nodeId;
  changed.emit();
}
