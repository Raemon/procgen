export const MIN_WORLD_WIDTH = 360;

export function panelWidthsThatLeaveRoomForWorld(
  requested: readonly number[],
  handleWidth: number,
  smallestPanelWidth: number,
  availableWidth: number,
): number[] {
  const budget = availableWidth - MIN_WORLD_WIDTH - requested.length * handleWidth;
  const requestedTotal = requested.reduce((total, width) => total + width, 0);
  if (requestedTotal <= budget) return [...requested];
  return requested.map((width) =>
    Math.max(smallestPanelWidth, Math.floor((width * budget) / requestedTotal)),
  );
}
