// Grid — a rectangle of tile ids. The one world representation every view and
// every generator pass reads and writes.

/** Cell value meaning "no tile here". */
export const EMPTY = -1;

/** Stored in the Uint16Array as the empty sentinel. */
const EMPTY_U16 = 0xffff;

export class Grid {
  readonly width: number;
  readonly height: number;
  private readonly cells: Uint16Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Uint16Array(width * height).fill(EMPTY_U16);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /** Tile id at (x, y), or EMPTY (-1) for unset or out-of-bounds cells. */
  get(x: number, y: number): number {
    if (!this.inBounds(x, y)) return EMPTY;
    const v = this.cells[y * this.width + x]!;
    return v === EMPTY_U16 ? EMPTY : v;
  }

  set(x: number, y: number, tileId: number): void {
    if (!this.inBounds(x, y)) return;
    this.cells[y * this.width + x] = tileId < 0 ? EMPTY_U16 : tileId;
  }

  /** Every cell, row-major. For passes that sweep the whole grid. */
  forEach(fn: (x: number, y: number, tileId: number) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        fn(x, y, this.get(x, y));
      }
    }
  }

  copyFrom(other: Grid): void {
    this.cells.set(other.cells);
  }

  clone(): Grid {
    const g = new Grid(this.width, this.height);
    g.copyFrom(this);
    return g;
  }
}
