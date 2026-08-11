import { browserHardware } from '../../performance/browserHardware';
import { browserMemory } from '../../performance/browserMemory';
import { gpuSceneLoad } from '../../performance/gpuSceneLoad';
import { longTasksAreObservable, recentLongTasks } from '../../performance/longTaskWatch';
import { formatCount, formatMb, formatMs } from './formatMeasurements';
import { BROWSER_LOAD_TIP } from './help/performanceTips';
import { MetricRow } from './MetricRow';
import { PerformanceSection } from './PerformanceSection';
import { useSampledValue } from './useSampledValue';

const BROWSER_SAMPLE_MS = 1000;

export function BrowserLoadSection() {
  const readout = useSampledValue(browserLoadReadout, BROWSER_SAMPLE_MS);
  return (
    <PerformanceSection tip={BROWSER_LOAD_TIP}>
      {readout.memory && (
        <MetricRow label="js heap">
          {formatMb(readout.memory.usedHeapMb)} of {formatMb(readout.memory.heapLimitMb)}
        </MetricRow>
      )}
      <MetricRow label="cpu cores">{readout.hardware.cpuCores ?? 'unknown'}</MetricRow>
      {readout.hardware.deviceMemoryGb !== null && (
        <MetricRow label="device memory">{readout.hardware.deviceMemoryGb} GB</MetricRow>
      )}
      <MetricRow label={`long tasks (${readout.longTasks.windowSeconds}s)`}>
        {longTasksAreObservable()
          ? `${readout.longTasks.count} · worst ${formatMs(readout.longTasks.worstMs)}`
          : 'not measured by this browser'}
      </MetricRow>
      {readout.gpu && (
        <>
          <MetricRow label="draw calls">{formatCount(readout.gpu.drawCalls)}</MetricRow>
          <MetricRow label="triangles">{formatCount(readout.gpu.triangles)}</MetricRow>
          <MetricRow label="geometries · textures">
            {formatCount(readout.gpu.geometries)} · {formatCount(readout.gpu.textures)}
          </MetricRow>
        </>
      )}
    </PerformanceSection>
  );
}

function browserLoadReadout() {
  return {
    memory: browserMemory(),
    hardware: browserHardware(),
    longTasks: recentLongTasks(),
    gpu: gpuSceneLoad(),
  };
}
