import type { InputSpec } from '../../procgen/nodeType';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { wiringCandidates } from '../../procgen/pipeline/wiringRules';
import { labeledRow, selectInput } from './rowElements';

const UNWIRED = '';

export function wiringRow(
  store: PipelineStore,
  node: NodeInstance,
  inputName: string,
  spec: InputSpec,
): HTMLElement {
  const select = selectInput(
    wiringOptions(store, node, spec),
    node.inputs[inputName] ?? UNWIRED,
    (value) => store.wireInput(node.id, inputName, value === UNWIRED ? null : value),
  );
  const row = labeledRow(`← ${spec.label}`, select);
  if (!spec.optional && !node.inputs[inputName]) row.classList.add('wire-missing');
  return row;
}

function wiringOptions(
  store: PipelineStore,
  node: NodeInstance,
  spec: InputSpec,
): { value: string; text: string }[] {
  const placeholder = spec.optional ? '(none)' : '(required)';
  return [
    { value: UNWIRED, text: placeholder },
    ...wiringCandidates(store.snapshot(), node.id, spec).map((source) => ({
      value: source.id,
      text: source.label,
    })),
  ];
}
