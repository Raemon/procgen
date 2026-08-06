import type { TileDef } from '../../world/tiles/tileDef';
import { blankFacePixels, FACE_ART_SIZE } from '../../world/tiles/tileFaceArt';
import type { EditableTileFields } from '../../world/tiles/tileset';
import { paintFacePixels } from '../../views/paintFacePixels';
import { pixelArtEditor, type PixelArtEditor } from './pixelArtEditor';

export type TileRowCallbacks = {
  onEdit(patch: EditableTileFields): void;
  onDelete(): void;
};

type EditTile = (patch: EditableTileFields) => void;

export function tileRow(tile: TileDef, callbacks: TileRowCallbacks): HTMLElement {
  const entry = document.createElement('div');
  entry.className = 'tile-entry';
  const refreshers: (() => void)[] = [];
  const onEdit: EditTile = (patch) => {
    callbacks.onEdit(patch);
    for (const refresh of refreshers) refresh();
  };
  const editor = pixelArtEditor(tile, onEdit);
  editor.root.classList.add('hidden');
  const artToggle = faceArtToggleButton(tile, editor);
  refreshers.push(editor.refresh, artToggle.refreshPreview);
  entry.append(rowElement(tile, onEdit, artToggle.button, callbacks.onDelete), editor.root);
  return entry;
}

function rowElement(
  tile: TileDef,
  onEdit: EditTile,
  artToggle: HTMLButtonElement,
  onDelete: () => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'tile-row';
  row.append(
    colorPicker(tile, onEdit),
    symbolInput(tile, onEdit),
    nameInput(tile, onEdit),
    walkableToggle(tile, onEdit),
    artToggle,
    deleteButton(onDelete),
  );
  return row;
}

function faceArtToggleButton(
  tile: TileDef,
  editor: PixelArtEditor,
): { button: HTMLButtonElement; refreshPreview(): void } {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn tile-art';
  button.title = 'pixel art (top/sides/bottom)';
  const preview = document.createElement('canvas');
  preview.width = preview.height = FACE_ART_SIZE;
  button.appendChild(preview);
  const refreshPreview = () => drawTopFacePreview(preview, tile);
  button.addEventListener('click', () => toggleEditor(button, editor));
  refreshPreview();
  return { button, refreshPreview };
}

function drawTopFacePreview(preview: HTMLCanvasElement, tile: TileDef): void {
  paintFacePixels(preview.getContext('2d')!, tile.faceArt?.top ?? blankFacePixels(), tile.color, 1);
}

function toggleEditor(button: HTMLButtonElement, editor: PixelArtEditor): void {
  const nowHidden = editor.root.classList.toggle('hidden');
  button.classList.toggle('active', !nowHidden);
  if (!nowHidden) editor.refresh();
}

function colorPicker(tile: TileDef, onEdit: EditTile): HTMLElement {
  const color = document.createElement('input');
  color.type = 'color';
  color.value = tile.color;
  color.title = 'color';
  color.addEventListener('input', () => onEdit({ color: color.value }));
  return color;
}

function symbolInput(tile: TileDef, onEdit: EditTile): HTMLElement {
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

function nameInput(tile: TileDef, onEdit: EditTile): HTMLElement {
  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'tile-name';
  name.value = tile.name;
  name.title = 'name';
  name.addEventListener('input', () => onEdit({ name: name.value }));
  return name;
}

function walkableToggle(tile: TileDef, onEdit: EditTile): HTMLElement {
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

function deleteButton(onDelete: () => void): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn tile-del';
  button.textContent = '×';
  button.title = 'delete tile';
  button.addEventListener('click', () => onDelete());
  return button;
}
