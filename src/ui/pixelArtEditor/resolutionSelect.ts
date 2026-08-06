import { FACE_ART_SIZES } from '../../world/tiles/tileFaceArt';

export function resolutionSelect(onSelect: (size: number) => void): {
  root: HTMLSelectElement;
  refresh(size: number): void;
} {
  const select = document.createElement('select');
  select.className = 'pixel-resolution';
  select.title = 'art resolution (existing art is rescaled)';
  select.append(...FACE_ART_SIZES.map(sizeOption));
  select.addEventListener('change', () => onSelect(Number(select.value)));
  return { root: select, refresh: (size) => (select.value = String(size)) };
}

function sizeOption(size: number): HTMLOptionElement {
  const option = document.createElement('option');
  option.value = String(size);
  option.textContent = `${size}×${size}`;
  return option;
}
