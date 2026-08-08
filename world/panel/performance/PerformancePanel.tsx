import { useEffect } from 'react';
import type { FrameStats } from '../../../perf/frameTimeline';
import { watchLongTasks } from '../../../perf/longTaskWatch';
import { BrowserLoadSection } from './BrowserLoadSection';
import { FrameTimeSection } from './FrameTimeSection';
import { ServerLoadSection } from './ServerLoadSection';
import { WorkBreakdownSection } from './WorkBreakdownSection';

export function PerformancePanel({ frames }: { frames: FrameStats }) {
  useEffect(watchLongTasks, []);
  return (
    <div className="max-h-[70vh] w-72 overflow-auto rounded border border-panel-edge bg-panel/95 p-3 text-[11px] shadow-lg">
      <div className="flex flex-col gap-3">
        <FrameTimeSection frames={frames} />
        <WorkBreakdownSection />
        <BrowserLoadSection />
        <ServerLoadSection />
      </div>
    </div>
  );
}
