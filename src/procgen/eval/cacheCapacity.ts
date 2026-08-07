const CHUNKS_KEPT_PER_NODE = 512;
const SMALLEST_CACHE = 4096;

export function cacheCapacityForPipeline(nodeCount: number): number {
  return Math.max(SMALLEST_CACHE, nodeCount * CHUNKS_KEPT_PER_NODE);
}
