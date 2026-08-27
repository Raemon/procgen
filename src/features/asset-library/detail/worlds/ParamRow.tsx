import { nodeTypeOf } from '@/features/asset-library/worlds/nodeRegistry';
import type { ParamSpec, ParamValue } from '@/features/asset-library/worlds/nodeType';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { useEditedPipeline } from './editing/editedPipelineContext';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Select } from '@/features/app-shell/controls/Select';
import { Slider } from '@/features/app-shell/controls/Slider';
import { ValueReadout } from '@/features/app-shell/controls/ValueReadout';
import { CodeParam } from './CodeParam';
import { paramTooltip } from './help/paramTooltip';
import { tileSelectOptions } from '@/features/app-shell/controls/tileSelectOptions';

export interface ParamRowProps {
  node: NodeInstance;
  spec: ParamSpec;
  tileAssets: ReadOnlyTileAssets;
  value: ParamValue;
  onChange(value: ParamValue): void;
}

export function ParamRow(props: ParamRowProps) {
  if (props.spec.kind === 'code')
    return <CodeParam spec={props.spec} value={String(props.value)} onChange={props.onChange} />;
  return (
    <KnobRow label={props.spec.label} tip={paramTooltip(props.spec)}>
      <ParamControl {...props} />
    </KnobRow>
  );
}

function ParamControl({ node, spec, tileAssets, value, onChange }: ParamRowProps) {
  if (spec.kind === 'pointKey')
    return <PointKeySelect node={node} from={spec.from} value={String(value)} onChange={onChange} />;
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
      options={tileSelectOptions(tileAssets, '(empty)')}
      onChange={(picked) => onChange(Number(picked))}
    />
  );
}

function PointKeySelect({
  node,
  from,
  value,
  onChange,
}: {
  node: NodeInstance;
  from: string;
  value: string;
  onChange(value: ParamValue): void;
}) {
  const { store } = useEditedPipeline();
  const source = store.nodes().find((candidate) => candidate.id === node.inputs[from]);
  const declared = source ? (nodeTypeOf(source.type)?.pointAttributes ?? []) : [];
  const options = declared.map((attr) => ({ value: attr.key, text: attr.label }));
  if (!options.some((option) => option.value === value)) options.unshift({ value, text: value });
  return <Select value={value} options={options} onChange={onChange} />;
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
