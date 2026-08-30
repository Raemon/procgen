import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Select } from '@/features/app-shell/controls/Select';
import { Slider } from '@/features/app-shell/controls/Slider';
import { ValueReadout } from '@/features/app-shell/controls/ValueReadout';
import type { Culture } from '../cultureDef';
import { CULTURE_PROPORTION_KNOBS, proportionOf } from '../cultureProportionKnobs';
import { ROOF_STYLE_CHOICES } from '../roofStyleChoices';
import { cultureProportionTip, ROOF_STYLE_TIP } from './help/cultureTips';

export function CultureProportionSliders({ culture }: { culture: Culture }) {
  const { perform } = useAppRuntime();
  const setProportion = (param: string, value: number) =>
    perform('set_culture_numbers', { culture_id: culture.id, [param]: value });
  return (
    <>
      <KnobRow label="roof style" tip={ROOF_STYLE_TIP}>
        <Select
          value={String(culture.roofStyle)}
          options={ROOF_STYLE_CHOICES.map((choice) => ({
            value: String(choice.value),
            text: choice.label,
          }))}
          onChange={(value) => setProportion('roof_style', Number(value))}
        />
      </KnobRow>
      {CULTURE_PROPORTION_KNOBS.map((knob) => (
        <KnobRow key={knob.param} label={knob.label} tip={cultureProportionTip(knob)}>
          <Slider
            min={knob.min}
            max={knob.max}
            step={1}
            value={proportionOf(culture, knob)}
            onChange={(value) => setProportion(knob.param, value)}
          />
          <ValueReadout value={proportionOf(culture, knob)} />
        </KnobRow>
      ))}
    </>
  );
}
