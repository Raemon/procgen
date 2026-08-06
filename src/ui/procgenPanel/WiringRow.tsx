import { useAppRuntime } from '../../app/appRuntimeContext';
import type { InputSpec } from '../../procgen/nodeType';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { wiringCandidates } from '../../procgen/pipeline/wiringRules';
import { KnobRow } from '../controls/KnobRow';
import { Select } from '../controls/Select';
import { wiringTooltip } from './help/wiringTooltip';
import { highlightWireSource } from './wireHighlight';

const UNWIRED = '';

export function WiringRow({
  node,
  inputName,
  spec,
}: {
  node: NodeInstance;
  inputName: string;
  spec: InputSpec;
}) {
  const { store } = useAppRuntime();
  const wiredTo = node.inputs[inputName] ?? UNWIRED;
  return (
    <div
      onMouseEnter={() => highlightWireSource(wiredTo || null)}
      onMouseLeave={() => highlightWireSource(null)}
    >
      <KnobRow label={`← ${spec.label}`} tooltip={wiringTooltip(spec)}>
        <Select
          warn={missingWire(node, inputName, spec)}
          value={wiredTo}
          options={wiringOptions(store, node, spec)}
          onChange={(value) =>
            store.wireInput(node.id, inputName, value === UNWIRED ? null : value)
          }
        />
      </KnobRow>
    </div>
  );
}

function missingWire(node: NodeInstance, inputName: string, spec: InputSpec): boolean {
  return !spec.optional && !node.inputs[inputName];
}

function wiringOptions(store: PipelineStore, node: NodeInstance, spec: InputSpec) {
  return [
    { value: UNWIRED, text: spec.optional ? '(none)' : '(required)' },
    ...wiringCandidates(store.snapshot(), node.id, spec).map((source) => ({
      value: source.id,
      text: source.label,
    })),
  ];
}
