import type { ParamSpec, ParamValue } from '../../procgen/nodeType';
import type { Tileset } from '../../world/tiles/tileset';
import { attachTooltip } from '../tooltips/floatingTooltip';
import { paramTooltip } from './help/paramTooltip';
import { formatNumber, labeledRow, rangeInput, selectInput, valueReadout } from './rowElements';
import { tileSelectOptions } from './tileSelectOptions';

export interface ParamRowDeps {
  tileset: Tileset;
  value: ParamValue;
  onChange: (value: ParamValue) => void;
}

export function paramRow(spec: ParamSpec, deps: ParamRowDeps): HTMLElement {
  const row = paramControl(spec, deps);
  if (spec.kind !== 'code') attachTooltip(row, paramTooltip(spec));
  return row;
}

function paramControl(spec: ParamSpec, deps: ParamRowDeps): HTMLElement {
  if (spec.kind === 'number') return sliderRow(spec.label, spec.min, spec.max, spec.step, deps);
  if (spec.kind === 'int') return sliderRow(spec.label, spec.min, spec.max, 1, deps);
  if (spec.kind === 'boolean') return checkboxRow(spec.label, deps);
  if (spec.kind === 'select') return selectRow(spec.label, spec.options, deps);
  if (spec.kind === 'tile') return tileRow(spec.label, deps);
  if (spec.kind === 'code') return codeRow(spec, deps);
  return textRow(spec.label, deps);
}

function sliderRow(
  label: string,
  min: number,
  max: number,
  step: number,
  deps: ParamRowDeps,
): HTMLElement {
  const startValue = Number(deps.value);
  const readout = valueReadout(formatNumber(startValue));
  const slider = rangeInput(min, max, step, startValue, (value) => {
    readout.textContent = formatNumber(value);
    deps.onChange(value);
  });
  return labeledRow(label, slider, readout);
}

function checkboxRow(label: string, deps: ParamRowDeps): HTMLElement {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(deps.value);
  checkbox.addEventListener('change', () => deps.onChange(checkbox.checked));
  return labeledRow(label, checkbox);
}

function selectRow(label: string, options: readonly string[], deps: ParamRowDeps): HTMLElement {
  const select = selectInput(
    options.map((option) => ({ value: option, text: option })),
    String(deps.value),
    (value) => deps.onChange(value),
  );
  return labeledRow(label, select);
}

function tileRow(label: string, deps: ParamRowDeps): HTMLElement {
  const options = tileSelectOptions(deps.tileset, '(empty)');
  const select = selectInput(options, String(deps.value), (value) => deps.onChange(Number(value)));
  return labeledRow(label, select);
}

function textRow(label: string, deps: ParamRowDeps): HTMLElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'text-param';
  input.value = String(deps.value);
  input.addEventListener('change', () => deps.onChange(input.value));
  return labeledRow(label, input);
}

function codeRow(spec: ParamSpec, deps: ParamRowDeps): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'code-param';
  const editor = codeEditor(String(deps.value));
  const apply = applyCodeButton(editor, deps);
  attachTooltip(apply, paramTooltip(spec));
  wrap.append(editor, apply);
  return wrap;
}

function codeEditor(startValue: string): HTMLTextAreaElement {
  const editor = document.createElement('textarea');
  editor.className = 'code-editor';
  editor.spellcheck = false;
  editor.rows = 10;
  editor.value = startValue;
  return editor;
}

function applyCodeButton(editor: HTMLTextAreaElement, deps: ParamRowDeps): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn apply-code';
  button.textContent = 'apply code';
  button.addEventListener('click', () => deps.onChange(editor.value));
  editor.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') deps.onChange(editor.value);
  });
  return button;
}
