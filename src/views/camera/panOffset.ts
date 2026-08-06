export class PanOffset {
  private x = 0;
  private y = 0;

  tilesX(): number {
    return this.x;
  }

  tilesY(): number {
    return this.y;
  }

  shiftBy(dxTiles: number, dyTiles: number): void {
    this.x += dxTiles;
    this.y += dyTiles;
  }

  recenter(): boolean {
    const wasOffset = this.x !== 0 || this.y !== 0;
    this.x = 0;
    this.y = 0;
    return wasOffset;
  }
}
