import { recentWorkLoad } from '../../performance/workTimers';
import { WORK_BREAKDOWN_TIP } from './help/performanceTips';
import { PerformanceSection } from './PerformanceSection';
import { useSampledValue } from './useSampledValue';
import { WorkLoadRow } from './WorkLoadRow';

const WORK_SAMPLE_MS = 500;

export function WorkBreakdownSection() {
  const loads = useSampledValue(recentWorkLoad, WORK_SAMPLE_MS);
  return (
    <PerformanceSection tip={WORK_BREAKDOWN_TIP}>
      {loads.length === 0 ? (
        <span className="text-ink-dim">nothing timed in the last second — the world is idle</span>
      ) : (
        loads.map((load) => <WorkLoadRow key={load.name} load={load} />)
      )}
    </PerformanceSection>
  );
}
