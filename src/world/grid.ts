export const EMPTY = -1;

const EMPTY_STORED_AS = 0xffff;

export class Grid {
  private readonly cells: Uint16Array;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.cells = new Uint16Array(width * height).fill(EMPTY_STORED_AS);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number): number {
    if (!this.inBounds(x, y)) return EMPTY;
    const stored = this.cells[this.indexOf(x, y)]!;
    return stored === EMPTY_STORED_AS ? EMPTY : stored;
  }

  set(x: number, y: number, tileId: number): void {
    if (!this.inBounds(x, y)) return;
    this.cells[this.indexOf(x, y)] = tileId < 0 ? EMPTY_STORED_AS : tileId;
  }

  indexOf(x: number, y: number): number {
    return y * this.width + x;
  }

  forEach(visit: (x: number, y: number, tileId: number) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        visit(x, y, this.get(x, y));
      }
    }
  }

  copyFrom(other: Grid): void {
    this.cells.set(other.cells);
  }

  clone(): Grid {
    const copy = new Grid(this.width, this.height);
    copy.copyFrom(this);
    return copy;
  }
}
