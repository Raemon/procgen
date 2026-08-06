const collapsedIds = new Set<string>();

export function isNodeCollapsed(nodeId: string): boolean {
  return collapsedIds.has(nodeId);
}

export function toggleNodeCollapsed(nodeId: string): boolean {
  if (collapsedIds.has(nodeId)) collapsedIds.delete(nodeId);
  else collapsedIds.add(nodeId);
  return collapsedIds.has(nodeId);
}
