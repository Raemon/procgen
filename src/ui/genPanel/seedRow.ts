const MAX_RANDOM_SEED = 1_000_000;

export function seedRow(startSeed: number, onChange: (seed: number) => void): HTMLElement {
  const row = document.createElement('div');
  row.className = 'knob';
  const input = seedInput(startSeed, onChange);
  row.append(seedLabel(), input, diceButton(input, onChange));
  return row;
}

function seedInput(startSeed: number, onChange: (seed: number) => void): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'seed-input';
  input.value = String(startSeed);
  input.addEventListener('input', () => {
    const seed = Number(input.value);
    if (Number.isFinite(seed)) onChange(Math.round(seed));
  });
  return input;
}

function diceButton(input: HTMLInputElement, onChange: (seed: number) => void): HTMLElement {
  const dice = document.createElement('button');
  dice.type = 'button';
  dice.className = 'btn dice';
  dice.title = 'randomize seed';
  dice.textContent = '🎲';
  dice.addEventListener('click', () => {
    const seed = Math.floor(Math.random() * MAX_RANDOM_SEED);
    input.value = String(seed);
    onChange(seed);
  });
  return dice;
}

function seedLabel(): HTMLElement {
  const label = document.createElement('label');
  label.textContent = 'seed';
  return label;
}
