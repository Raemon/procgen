import { useEffect } from 'react';
import { recentFrameStats, watchFrameTimeline, type FrameStats } from '../../performance/frameTimeline';
import { useSampledValue } from './useSampledValue';

const FRAME_STATS_SAMPLE_MS = 500;

export function useFrameStats(): FrameStats {
  useEffect(watchFrameTimeline, []);
  return useSampledValue(recentFrameStats, FRAME_STATS_SAMPLE_MS);
}
