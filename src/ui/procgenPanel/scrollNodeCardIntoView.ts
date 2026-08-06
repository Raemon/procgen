export function scrollNodeCardIntoView(nodeId: string): void {
  requestAnimationFrame(() =>
    document
      .querySelector(`[data-node-id="${nodeId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
  );
}
