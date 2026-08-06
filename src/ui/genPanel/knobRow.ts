import { formatKnobValue, type Knob } from './knobs';

export function knobRow(
  knob: Knob,
  startValue: number,
  onChange: (value: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'knob';
  const readout = valueReadout(startValue);
  row.append(
    labelFor(knob.label),
    knobSlider(knob, startValue, (value) => {
      readout.textContent = formatKnobValue(value);
      onChange(value);
    }),
    readout,
  );
  return row;
}

function knobSlider(
  knob: Knob,
  startValue: number,
  onChange: (value: number) => void,
): HTMLInputElement {
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(knob.min);
  slider.max = String(knob.max);
  slider.step = String(knob.step);
  slider.value = String(startValue);
  slider.addEventListener('input', () => onChange(Number(slider.value)));
  return slider;
}

function valueReadout(value: number): HTMLElement {
  const readout = document.createElement('span');
  readout.className = 'knob-value';
  readout.textContent = formatKnobValue(value);
  return readout;
}

function labelFor(text: string): HTMLElement {
  const label = document.createElement('label');
  label.textContent = text;
  return label;
}
