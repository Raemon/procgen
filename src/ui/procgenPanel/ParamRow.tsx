import type { ParamSpec, ParamValue } from '../../procgen/nodeType';
import type { Tileset } from '../../world/tiles/tileset';
import { KnobRow } from '../controls/KnobRow';
import { Select } from '../controls/Select';
import { Slider } from '../controls/Slider';
import { ValueReadout } from '../controls/ValueReadout';
import { CodeParam } from './CodeParam';
import { paramTooltip } from './help/paramTooltip';
import { tileSelectOptions } from './tileSelectOptions';

export interface ParamRowProps {
  spec: ParamSpec;
  tileset: Tileset;
  value: ParamValue;
  onChange(value: ParamValue): void;
}

export function ParamRow(props: ParamRowProps) {
  if (props.spec.kind === 'code')
    return <CodeParam spec={props.spec} value={String(props.value)} onChange={props.onChange} />;
  return (
    <KnobRow label={props.spec.label} tooltip={paramTooltip(props.spec)}>
      <ParamControl {...props} />
    </KnobRow>
  );
}

function ParamControl({ spec, tileset, value, onChange }: ParamRowProps) {
  if (spec.kind === 'number')
    return <NumberKnob min={spec.min} max={spec.max} step={spec.step} value={Number(value)} onChange={onChange} />;
  if (spec.kind === 'int')
    return <NumberKnob min={spec.min} max={spec.max} step={1} value={Number(value)} onChange={onChange} />;
  if (spec.kind === 'toggle')
    return (
      <input
        type="checkbox"
        className="accent-accent justify-self-start"
        checked={Number(value) === 1}
        onChange={(event) => onChange(event.target.checked ? 1 : 0)}
      />
    );
  if (spec.kind === 'choice')
    return (
      <Select
        value={String(value)}
        options={spec.options.map((option) => ({
          value: String(option.value),
          text: option.label,
        }))}
        onChange={(picked) => onChange(Number(picked))}
      />
    );
  if (spec.kind === 'select')
    return (
      <Select
        value={String(value)}
        options={spec.options.map((option) => ({ value: option, text: option }))}
        onChange={onChange}
      />
    );
  return (
    <Select
      value={String(value)}
      options={tileSelectOptions(tileset, '(empty)')}
      onChange={(picked) => onChange(Number(picked))}
    />
  );
}

function NumberKnob({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange(value: number): void;
}) {
  return (
    <>
      <Slider min={min} max={max} step={step} value={value} onChange={onChange} />
      <ValueReadout value={value} />
    </>
  );
}
