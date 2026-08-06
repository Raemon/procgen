// Tile editor panel — the tileset as editable rows: swatch, symbol, name,
// walkable, delete. Edits write straight into the Tileset (which persists and
// notifies the views); rows are only rebuilt on add/remove so typing in a name
// never loses focus.

import type { TileDef, Tileset } from './tiles';

export class TileEditor {
  private readonly list: HTMLElement;
  private renderedIds = '';

  constructor(
    container: HTMLElement,
    private readonly tileset: Tileset,
  ) {
    container.innerHTML = `
      <h2>tiles</h2>
      <div class="tile-list"></div>
      <button type="button" class="btn tile-add">+ add tile</button>
      <p class="hint">The generator targets tiles by role (water/sand/grass/tree/rock);
      added tiles are paintable groundwork for future rules.</p>
    `;
    this.list = container.querySelector('.tile-list')!;
    container.querySelector('.tile-add')!.addEventListener('click', () => {
      this.tileset.add();
    });
    tileset.onChange(() => this.render());
    this.render();
  }

  private render(): void {
    const tiles = this.tileset.all();
    const ids = tiles.map((t) => t.id).join(',');
    if (ids === this.renderedIds) return; // in-place edit; rows are current
    this.renderedIds = ids;
    this.list.innerHTML = '';
    for (const tile of tiles) this.list.appendChild(this.row(tile));
  }

  private row(tile: TileDef): HTMLElement {
    const row = document.createElement('div');
    row.className = 'tile-row';

    const color = document.createElement('input');
    color.type = 'color';
    color.value = tile.color;
    color.title = 'color';
    color.addEventListener('input', () => this.tileset.update(tile.id, { color: color.value }));

    const symbol = document.createElement('input');
    symbol.type = 'text';
    symbol.className = 'tile-symbol';
    symbol.maxLength = 1;
    symbol.value = tile.symbol;
    symbol.title = 'ascii symbol';
    symbol.addEventListener('input', () => {
      const ch = symbol.value.slice(0, 1);
      if (ch) this.tileset.update(tile.id, { symbol: ch });
    });

    const name = document.createElement('input');
    name.type = 'text';
    name.className = 'tile-name';
    name.value = tile.name;
    name.title = 'name';
    name.addEventListener('input', () => this.tileset.update(tile.id, { name: name.value }));

    const walk = document.createElement('label');
    walk.className = 'tile-walk';
    walk.title = 'walkable';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = tile.walkable;
    check.addEventListener('change', () =>
      this.tileset.update(tile.id, { walkable: check.checked }),
    );
    walk.append(check, document.createTextNode('walk'));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn tile-del';
    del.textContent = '×';
    del.title = 'delete tile';
    del.addEventListener('click', () => this.tileset.remove(tile.id));

    row.append(color, symbol, name, walk, del);
    return row;
  }
}
