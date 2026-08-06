import type { Tileset } from '../../world/tiles/tileset';
import { tileRow } from './tileRow';

export class TileEditor {
  private readonly list: HTMLElement;
  private renderedTileIds = '';

  constructor(
    container: HTMLElement,
    private readonly tileset: Tileset,
  ) {
    container.innerHTML = panelMarkup();
    this.list = container.querySelector('.tile-list')!;
    container.querySelector('.tile-add')!.addEventListener('click', () => this.tileset.add());
    tileset.onChange(() => this.renderWhenRowsAddedOrRemoved());
    this.renderWhenRowsAddedOrRemoved();
  }

  private renderWhenRowsAddedOrRemoved(): void {
    const tiles = this.tileset.all();
    const ids = tiles.map((tile) => tile.id).join(',');
    if (ids === this.renderedTileIds) return;
    this.renderedTileIds = ids;
    this.list.innerHTML = '';
    for (const tile of tiles) {
      this.list.appendChild(
        tileRow(tile, {
          onEdit: (patch) => this.tileset.update(tile.id, patch),
          onDelete: () => this.tileset.remove(tile.id),
        }),
      );
    }
  }
}

function panelMarkup(): string {
  return `
    <h2>tiles</h2>
    <div class="tile-list"></div>
    <button type="button" class="btn tile-add">+ add tile</button>
    <p class="hint">The generator targets tiles by role (water/sand/grass/tree/rock);
    added tiles are paintable groundwork for future rules.</p>
  `;
}
