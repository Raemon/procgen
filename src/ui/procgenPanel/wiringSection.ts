import type { InputSpec } from '../../procgen/nodeType';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { wiringCandidates } from '../../procgen/pipeline/wiringRules';
import { attachTooltip } from '../tooltips/floatingTooltip';
import { wiringTooltip } from './help/wiringTooltip';
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
  highlightSourceCardOnHover(row, select);
  attachTooltip(row, wiringTooltip(spec));
  return row;
}

function highlightSourceCardOnHover(row: HTMLElement, select: HTMLSelectElement): void {
  row.addEventListener('mouseenter', () => sourceCardOf(select)?.classList.add('wire-source'));
  row.addEventListener('mouseleave', () => sourceCardOf(select)?.classList.remove('wire-source'));
}

function sourceCardOf(select: HTMLSelectElement): HTMLElement | null {
  if (!select.value) return null;
  return document.querySelector<HTMLElement>(`.node-card[data-node-id="${select.value}"]`);
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
