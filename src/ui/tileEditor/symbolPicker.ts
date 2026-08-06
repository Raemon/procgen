import { GLYPH_GROUPS, type Glyph } from './symbolGlyphs';

let activeAnchor: HTMLInputElement | null = null;
let closeActive: (() => void) | null = null;

export function attachSymbolPicker(
  anchor: HTMLInputElement,
  onPick: (char: string) => void,
): void {
  anchor.addEventListener('click', () => openPicker(anchor, onPick));
}

function openPicker(anchor: HTMLInputElement, onPick: (char: string) => void): void {
  if (activeAnchor === anchor) return;
  closeActive?.();

  const picker = buildPicker(anchor.value, (char) => {
    onPick(char);
    close();
    anchor.focus();
  });
  document.body.appendChild(picker.root);
  positionNear(picker.root, anchor);
  picker.filter.focus();

  function close(): void {
    picker.root.remove();
    document.removeEventListener('pointerdown', closeWhenOutside, true);
    window.removeEventListener('scroll', closeWhenScrolledOutside, true);
    window.removeEventListener('resize', close);
    activeAnchor = null;
    closeActive = null;
  }

  function closeWhenOutside(event: PointerEvent): void {
    const target = event.target as Node;
    if (picker.root.contains(target) || target === anchor) return;
    close();
  }

  function closeWhenScrolledOutside(event: Event): void {
    if (picker.root.contains(event.target as Node)) return;
    close();
  }

  picker.root.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    close();
    anchor.focus();
  });
  document.addEventListener('pointerdown', closeWhenOutside, true);
  window.addEventListener('scroll', closeWhenScrolledOutside, true);
  window.addEventListener('resize', close);
  activeAnchor = anchor;
  closeActive = close;
}

interface GlyphCell {
  glyph: Glyph;
  groupTitle: string;
  button: HTMLButtonElement;
  visible: boolean;
}

interface Picker {
  root: HTMLElement;
  filter: HTMLInputElement;
}

function buildPicker(currentSymbol: string, pick: (char: string) => void): Picker {
  const root = document.createElement('div');
  root.className = 'symbol-picker';
  const cells: GlyphCell[] = [];
  const groups = document.createElement('div');
  groups.className = 'symbol-picker-groups';
  for (const group of GLYPH_GROUPS) {
    groups.appendChild(groupElement(group.title, group.glyphs, currentSymbol, cells, pick));
  }
  const empty = document.createElement('div');
  empty.className = 'symbol-picker-empty hidden';
  empty.textContent = 'no matches — press enter to use what you typed';
  const filter = filterField(applyFilter, pickBestMatch);
  root.append(filter, groups, empty);

  function applyFilter(query: string): void {
    for (const cell of cells) {
      cell.visible = matchesQuery(cell, query);
      cell.button.classList.toggle('hidden', !cell.visible);
    }
    let anyVisible = false;
    for (const groupEl of groups.children) {
      const hasVisible = groupEl.querySelector('.symbol-cell:not(.hidden)') !== null;
      groupEl.classList.toggle('hidden', !hasVisible);
      anyVisible ||= hasVisible;
    }
    empty.classList.toggle('hidden', anyVisible);
  }

  function pickBestMatch(query: string): void {
    const first = cells.find((cell) => cell.visible);
    if (first) return pick(first.glyph.char);
    const typed = [...query.trim()][0];
    if (typed) pick(typed);
  }

  return { root, filter };
}

function matchesQuery(cell: GlyphCell, query: string): boolean {
  if (!query) return true;
  if (cell.glyph.char.toLowerCase() === query) return true;
  return cell.glyph.name.includes(query) || cell.groupTitle.includes(query);
}

function filterField(
  onQuery: (query: string) => void,
  onEnter: (query: string) => void,
): HTMLInputElement {
  const filter = document.createElement('input');
  filter.type = 'text';
  filter.className = 'symbol-picker-filter';
  filter.placeholder = 'filter: star, arrow, box…';
  filter.addEventListener('input', () => onQuery(filter.value.trim().toLowerCase()));
  filter.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onEnter(filter.value);
  });
  return filter;
}

function groupElement(
  title: string,
  glyphs: Glyph[],
  currentSymbol: string,
  cells: GlyphCell[],
  pick: (char: string) => void,
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'symbol-picker-group';
  const label = document.createElement('div');
  label.className = 'symbol-picker-label';
  label.textContent = title;
  const grid = document.createElement('div');
  grid.className = 'symbol-picker-grid';
  for (const glyph of glyphs) {
    const button = glyphButton(glyph, currentSymbol, pick);
    cells.push({ glyph, groupTitle: title, button, visible: true });
    grid.appendChild(button);
  }
  group.append(label, grid);
  return group;
}

function glyphButton(
  glyph: Glyph,
  currentSymbol: string,
  pick: (char: string) => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'symbol-cell';
  button.textContent = glyph.char;
  button.title = glyph.name;
  if (glyph.char === currentSymbol) button.classList.add('selected');
  button.addEventListener('click', () => pick(glyph.char));
  return button;
}

function positionNear(root: HTMLElement, anchor: HTMLElement): void {
  const margin = 8;
  const rect = anchor.getBoundingClientRect();
  const popup = root.getBoundingClientRect();
  const left = Math.max(margin, Math.min(rect.left, window.innerWidth - popup.width - margin));
  const below = rect.bottom + 4;
  const fitsBelow = below + popup.height <= window.innerHeight - margin;
  const above = rect.top - popup.height - 4;
  const top = fitsBelow || above < margin ? below : above;
  root.style.left = `${left}px`;
  root.style.top = `${top}px`;
}
