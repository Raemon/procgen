import type { WorkLoad } from '../../performance/workTimers';
import { formatCount, formatMs } from './formatMeasurements';

const MS_IN_A_SECOND = 1000;

export function WorkLoadRow({ load }: { load: WorkLoad }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink">{load.name}</span>
        <span className="font-mono text-ink-dim">
          {formatMs(load.msPerSecond)}/s · {formatCount(load.callsPerSecond)}×
        </span>
      </div>
      <div className="h-1 rounded-full bg-field">
        <div
          className="h-1 rounded-full bg-accent"
          style={{ width: `${shareOfASecond(load)}%` }}
        />
      </div>
    </div>
  );
}

function shareOfASecond(load: WorkLoad): number {
  return Math.min(100, (load.msPerSecond / MS_IN_A_SECOND) * 100);
}
