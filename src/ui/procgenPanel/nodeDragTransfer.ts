export const NODE_ID_MIME = 'text/procgen-node-id';

export function draggedNodeId(dataTransfer: DataTransfer | null): string | null {
  return dataTransfer?.getData(NODE_ID_MIME) || null;
}

export function carriesNodeId(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer?.types.includes(NODE_ID_MIME) ?? false;
}
