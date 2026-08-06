export function labeledRow(labelText: string, ...controls: HTMLElement[]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'knob';
  row.append(rowLabel(labelText), ...controls);
  return row;
}

export function rowLabel(text: string): HTMLElement {
  const label = document.createElement('label');
  label.textContent = text;
  return label;
}

export function valueReadout(text: string): HTMLElement {
  const readout = document.createElement('span');
  readout.className = 'knob-value';
  readout.textContent = text;
  return readout;
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(value < 0.2 ? 3 : 2);
}

export function rangeInput(
  min: number,
  max: number,
  step: number,
  value: number,
  onInput: (value: number) => void,
): HTMLInputElement {
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);
  slider.addEventListener('input', () => onInput(Number(slider.value)));
  return slider;
}

export function selectInput(
  options: readonly { value: string; text: string }[],
  selected: string,
  onChange: (value: string) => void,
): HTMLSelectElement {
  const select = document.createElement('select');
  for (const option of options) {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.text;
    select.appendChild(element);
  }
  select.value = selected;
  select.addEventListener('change', () => onChange(select.value));
  return select;
}
