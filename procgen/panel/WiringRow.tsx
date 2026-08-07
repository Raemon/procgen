import { useAppRuntime } from '../../frontend/appRuntimeContext';
import type { InputSpec } from '../nodeType';
import type { NodeInstance } from '../pipeline/pipelineState';
import { wiringCandidates } from '../pipeline/wiringRules';
import { KnobRow } from '../../frontend/controls/KnobRow';
import { Select } from '../../frontend/controls/Select';
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
  const { store, perform } = useAppRuntime();
  const wiredTo = node.inputs[inputName] ?? UNWIRED;
  return (
    <div
      onMouseEnter={() => highlightWireSource(wiredTo || null)}
      onMouseLeave={() => highlightWireSource(null)}
    >
      <KnobRow label={`← ${spec.label}`} tip={wiringTooltip(spec)}>
        <Select
          warn={missingWire(node, inputName, spec)}
          value={wiredTo}
          options={wiringOptions(store.nodes(), node, spec)}
          onChange={(value) =>
            perform('wire_input', { node_id: node.id, input: inputName, source_node_id: value === UNWIRED ? null : value })
          }
        />
      </KnobRow>
    </div>
  );
}

function missingWire(node: NodeInstance, inputName: string, spec: InputSpec): boolean {
  return !spec.optional && !node.inputs[inputName];
}

function wiringOptions(nodes: readonly NodeInstance[], node: NodeInstance, spec: InputSpec) {
  return [
    { value: UNWIRED, text: spec.optional ? '(none)' : '(required)' },
    ...wiringCandidates(nodes, node.id, spec).map((source) => ({
      value: source.id,
      text: source.label,
    })),
  ];
}
