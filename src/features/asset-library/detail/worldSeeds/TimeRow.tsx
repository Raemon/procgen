import { useEditedPipeline } from './editing/editedPipelineContext';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Slider } from '@/features/app-shell/controls/Slider';
import { SCRUB_STEPS, scrubStepOfTime, timeOfScrubStep } from '@/features/asset-library/worlds/time/scrubberScale';
import { PRESENT } from '@/features/asset-library/worlds/time/worldTime';
import { TIME_TIP } from './help/pipelineTips';

export function TimeRow() {
  const { store, perform } = useEditedPipeline();
  const time = store.time();
  return (
    <KnobRow label="time" tip={TIME_TIP}>
      <Slider
        min={0}
        max={SCRUB_STEPS}
        step={1}
        value={scrubStepOfTime(time)}
        onChange={(step) => perform('set_time', { time: timeOfScrubStep(step) })}
      />
      <span className="min-w-[64px] text-right text-[11px]">{whenReadout(time)}</span>
    </KnobRow>
  );
}

function whenReadout(time: number): string {
  const yearsBack = PRESENT - time;
  if (yearsBack <= 0) return 'now';
  if (yearsBack < 1000) return `${Math.round(yearsBack)} yr ago`;
  if (yearsBack < 1_000_000) return `${Math.round(yearsBack / 1000)} kyr ago`;
  return `${(yearsBack / 1_000_000).toFixed(2)} Myr ago`;
}
