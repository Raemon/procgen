import type { ServerLoad } from '../../performance/serverLoadContract';
import { formatDuration, formatMb, formatMs, formatPercent } from './formatMeasurements';
import { HostProcessList } from './HostProcessList';
import { SERVER_LOAD_TIP } from './help/performanceTips';
import { MetricRow } from './MetricRow';
import { PerformanceSection } from './PerformanceSection';
import { useServerLoad } from './useServerLoad';

export function ServerLoadSection() {
  const load = useServerLoad();
  return (
    <PerformanceSection tip={SERVER_LOAD_TIP}>
      {load === null ? (
        <span className="text-ink-dim">no game server answering</span>
      ) : (
        <ServerLoadRows load={load} />
      )}
    </PerformanceSection>
  );
}

function ServerLoadRows({ load }: { load: ServerLoad }) {
  return (
    <>
      <MetricRow label="server cpu">
        {load.process.cpuPercent === null ? 'sampling' : formatPercent(load.process.cpuPercent)}
      </MetricRow>
      <MetricRow label="server memory">
        {formatMb(load.process.rssMb)} rss · {formatMb(load.process.heapUsedMb)} heap
      </MetricRow>
      <MetricRow label="event loop lag">{formatMs(load.eventLoopLagMs)}</MetricRow>
      <MetricRow label="load average">
        {load.process.loadAverage.map((entry) => entry.toFixed(2)).join(' ')}
      </MetricRow>
      <MetricRow label="host memory">
        {formatMb(load.process.hostMemoryUsedMb)} of {formatMb(load.process.hostMemoryTotalMb)}
      </MetricRow>
      <MetricRow label="uptime">
        {formatDuration(load.process.uptimeSeconds)} · pid {load.process.pid}
      </MetricRow>
      <HostProcessList
        processes={load.hostProcesses}
        withheld={load.hostProcessesWithheld}
        serverPid={load.process.pid}
      />
    </>
  );
}
