import { CHUNK_SIZE } from '../../procgen/chunk';

const MIN_RADIUS_CHUNKS = 2;
const MAX_RADIUS_CHUNKS = 6;

export function streamingRadiusChunks(visibleGroundRadiusTiles: number): number {
  const needed = Math.ceil(visibleGroundRadiusTiles / CHUNK_SIZE) + 1;
  return Math.max(MIN_RADIUS_CHUNKS, Math.min(MAX_RADIUS_CHUNKS, needed));
}
