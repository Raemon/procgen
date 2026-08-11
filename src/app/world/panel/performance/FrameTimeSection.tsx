import type { FrameStats } from '../../../perf/frameTimeline';
import { formatMs } from './formatMeasurements';
import { FRAME_TIME_TIP } from './help/performanceTips';
import { MetricRow } from './MetricRow';
import { PerformanceSection } from './PerformanceSection';

export function FrameTimeSection({ frames }: { frames: FrameStats }) {
  return (
    <PerformanceSection tip={FRAME_TIME_TIP}>
      <MetricRow label="frames per second">{frames.fps.toFixed(0)}</MetricRow>
      <MetricRow label="average frame">{formatMs(frames.averageFrameMs)}</MetricRow>
      <MetricRow label="worst frame">{formatMs(frames.worstFrameMs)}</MetricRow>
    </PerformanceSection>
  );
}
