import type { LatentReport } from './latentTypes';

export function offsetsForAxisAmounts(
  report: LatentReport,
  amountPerAxis: readonly number[],
): Map<string, number> {
  const offsets = new Map<string, number>();
  report.channelNodeIds.forEach((nodeId, channel) => {
    const offset = channelOffset(report, amountPerAxis, channel);
    if (offset !== 0) offsets.set(nodeId, offset + (offsets.get(nodeId) ?? 0));
  });
  return offsets;
}

function channelOffset(
  report: LatentReport,
  amountPerAxis: readonly number[],
  channel: number,
): number {
  return report.axes.reduce(
    (offset, axis, a) => offset + (amountPerAxis[a] ?? 0) * (axis.loadings[channel] ?? 0),
    0,
  );
}
