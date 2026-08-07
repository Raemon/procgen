import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { KnobRow } from '../../frontend/controls/KnobRow';
import { Slider } from '../../frontend/controls/Slider';
import { ValueReadout } from '../../frontend/controls/ValueReadout';
import { DAYLIGHT_TIP } from './help/pipelineTips';

export function WorldDaylightRow() {
  const { store, perform } = useAppRuntime();
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
