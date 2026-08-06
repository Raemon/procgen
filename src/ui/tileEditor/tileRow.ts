import type { TileDef } from '../../world/tiles/tileDef';
import type { EditableTileFields } from '../../world/tiles/tileset';

export type TileRowCallbacks = {
  onEdit(patch: EditableTileFields): void;
  onDelete(): void;
};

export function tileRow(tile: TileDef, callbacks: TileRowCallbacks): HTMLElement {
  const row = document.createElement('div');
  row.className = 'tile-row';
  row.append(
    colorPicker(tile, callbacks),
    symbolInput(tile, callbacks),
    nameInput(tile, callbacks),
    walkableToggle(tile, callbacks),
    deleteButton(callbacks),
  );
  return row;
}

function colorPicker(tile: TileDef, { onEdit }: TileRowCallbacks): HTMLElement {
  const color = document.createElement('input');
  color.type = 'color';
  color.value = tile.color;
  color.title = 'color';
  color.addEventListener('input', () => onEdit({ color: color.value }));
  return color;
}

function symbolInput(tile: TileDef, { onEdit }: TileRowCallbacks): HTMLElement {
  const symbol = document.createElement('input');
  symbol.type = 'text';
  symbol.className = 'tile-symbol';
  symbol.maxLength = 1;
  symbol.value = tile.symbol;
  symbol.title = 'ascii symbol';
  symbol.addEventListener('input', () => {
    const character = symbol.value.slice(0, 1);
    if (character) onEdit({ symbol: character });
  });
  return symbol;
}

function nameInput(tile: TileDef, { onEdit }: TileRowCallbacks): HTMLElement {
  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'tile-name';
  name.value = tile.name;
  name.title = 'name';
  name.addEventListener('input', () => onEdit({ name: name.value }));
  return name;
}

function walkableToggle(tile: TileDef, { onEdit }: TileRowCallbacks): HTMLElement {
  const wrapper = document.createElement('label');
  wrapper.className = 'tile-walk';
  wrapper.title = 'walkable';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = tile.walkable;
  checkbox.addEventListener('change', () => onEdit({ walkable: checkbox.checked }));
  wrapper.append(checkbox, document.createTextNode('walk'));
  return wrapper;
}

function deleteButton({ onDelete }: TileRowCallbacks): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn tile-del';
  button.textContent = '×';
  button.title = 'delete tile';
  button.addEventListener('click', () => onDelete());
  return button;
}
