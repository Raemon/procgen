import { MAX_LIGHT_RADIUS, type LightEmitter } from '../lightEmission';
import { ColorField } from '@/features/app-shell/controls/ColorField';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Slider } from '@/features/app-shell/controls/Slider';
import { ValueReadout } from '@/features/app-shell/controls/ValueReadout';
import { LIGHT_INK_TIP, LIGHT_RADIUS_TIP } from './help/lightTips';

export function LightKnobRows({
  emitter,
  onChange,
}: {
  emitter: LightEmitter;
  onChange(patch: { light?: number; light_ink?: string }): void;
}) {
  return (
    <>
      <KnobRow label="light" tip={LIGHT_RADIUS_TIP}>
        <Slider
          min={0}
          max={MAX_LIGHT_RADIUS}
          step={1}
          value={emitter.light}
          onChange={(light) => onChange({ light })}
        />
        <ValueReadout value={emitter.light} />
      </KnobRow>
      {emitter.light > 0 && (
        <KnobRow label="light ink" tip={LIGHT_INK_TIP}>
          <ColorField
            ink={emitter.lightInk}
            tip={LIGHT_INK_TIP}
            onChange={(lightInk) => onChange({ light_ink: lightInk })}
          />
        </KnobRow>
      )}
    </>
  );
}
