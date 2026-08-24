import { useEditedPipeline } from './editing/editedPipelineContext';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Slider } from '@/features/app-shell/controls/Slider';
import { ValueReadout } from '@/features/app-shell/controls/ValueReadout';
import { DAYLIGHT_TIP } from './help/pipelineTips';

export function DaylightRow() {
  const { store, perform } = useEditedPipeline();
  return (
    <KnobRow label="daylight" tip={DAYLIGHT_TIP}>
      <Slider
        min={0}
        max={1}
        step={0.05}
        value={store.daylight()}
        onChange={(daylight) => perform('set_daylight', { daylight })}
      />
      <ValueReadout value={store.daylight()} />
    </KnobRow>
  );
}
