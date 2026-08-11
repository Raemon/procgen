import type { HostProcess } from '../../performance/heaviestHostProcesses';
import { classes } from '@/features/app-shell/controls/classes';
import { formatPercent } from './formatMeasurements';

export function HostProcessList({
  processes,
  withheld,
  serverPid,
}: {
  processes: HostProcess[];
  withheld: boolean;
  serverPid: number;
}) {
  if (withheld) {
    return (
      <span className="text-ink-dim">
        host processes are only listed when the page is served from this machine
      </span>
    );
  }
  if (processes.length === 0) {
    return <span className="text-ink-dim">the host would not list its processes</span>;
  }
  return (
    <div className="mt-1 flex flex-col gap-0.5">
      {processes.map((entry) => (
        <HostProcessRow key={entry.pid} process={entry} isThisServer={entry.pid === serverPid} />
      ))}
    </div>
  );
}

function HostProcessRow({
  process,
  isThisServer,
}: {
  process: HostProcess;
  isThisServer: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={classes('truncate', isThisServer ? 'text-accent' : 'text-ink')}>
        {process.command}
      </span>
      <span className="shrink-0 font-mono text-ink-dim">
        {formatPercent(process.cpuPercent)} cpu · {formatPercent(process.memoryPercent)} mem
      </span>
    </div>
  );
}
