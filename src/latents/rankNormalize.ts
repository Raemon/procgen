export function rankNormalized(channel: Float32Array): Float32Array {
  const order = sortedIndices(channel);
  const ranks = new Float32Array(channel.length);
  const top = Math.max(1, channel.length - 1);
  fillTieAveragedRanks(channel, order, ranks, top);
  return ranks;
}

function sortedIndices(channel: Float32Array): Uint32Array {
  const order = new Uint32Array(channel.length);
  for (let i = 0; i < order.length; i++) order[i] = i;
  return order.sort((a, b) => channel[a]! - channel[b]!);
}

function fillTieAveragedRanks(
  channel: Float32Array,
  order: Uint32Array,
  ranks: Float32Array,
  top: number,
): void {
  let start = 0;
  while (start < order.length) {
    const end = tieGroupEnd(channel, order, start);
    const averageRank = (start + end - 1) / 2 / top;
    for (let i = start; i < end; i++) ranks[order[i]!] = averageRank;
    start = end;
  }
}

function tieGroupEnd(channel: Float32Array, order: Uint32Array, start: number): number {
  const value = channel[order[start]!]!;
  let end = start + 1;
  while (end < order.length && channel[order[end]!] === value) end++;
  return end;
}
