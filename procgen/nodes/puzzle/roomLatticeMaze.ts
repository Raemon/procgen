import { hashString } from '../../random/hashString';
import { mulberry32 } from '../../random/mulberry32';
import { braidCellMaze } from '../maze/braidCellMaze';
import { isOpenBetween, type CellMaze } from '../maze/cellMaze';
import { carveCellMaze } from '../maze/mazeCarvers';
import type { PuzzleRoomKnobs } from './puzzleRoomKnobs';

const REGIONS_KEPT = 256;

interface LocalCell {
  regionX: number;
  regionY: number;
  x: number;
  y: number;
}

export class RoomLatticeMaze {
  private readonly carvedRegions = new Map<string, CellMaze>();

  constructor(private readonly knobs: PuzzleRoomKnobs) {}

  hasEastCorridor(roomX: number, roomY: number): boolean {
    const local = this.localCell(roomX, roomY);
    if (local.x < this.cells() - 1) return this.opensEastward(local);
    return this.borderDoors(local.regionX + 1, local.regionY, 'west').has(local.y);
  }

  hasSouthCorridor(roomX: number, roomY: number): boolean {
    const local = this.localCell(roomX, roomY);
    if (local.y < this.cells() - 1) return this.opensSouthward(local);
    return this.borderDoors(local.regionX, local.regionY + 1, 'north').has(local.x);
  }

  corridorsTouching(roomX: number, roomY: number): number {
    return [
      this.hasEastCorridor(roomX, roomY),
      this.hasSouthCorridor(roomX, roomY),
      this.hasEastCorridor(roomX - 1, roomY),
      this.hasSouthCorridor(roomX, roomY - 1),
    ].filter(Boolean).length;
  }

  private cells(): number {
    return this.knobs.regionRooms;
  }

  private localCell(roomX: number, roomY: number): LocalCell {
    const cells = this.cells();
    const regionX = Math.floor(roomX / cells);
    const regionY = Math.floor(roomY / cells);
    return { regionX, regionY, x: roomX - regionX * cells, y: roomY - regionY * cells };
  }

  private opensEastward(local: LocalCell): boolean {
    const maze = this.region(local.regionX, local.regionY);
    return isOpenBetween(maze, { x: local.x, y: local.y }, { x: local.x + 1, y: local.y });
  }

  private opensSouthward(local: LocalCell): boolean {
    const maze = this.region(local.regionX, local.regionY);
    return isOpenBetween(maze, { x: local.x, y: local.y }, { x: local.x, y: local.y + 1 });
  }

  private region(regionX: number, regionY: number): CellMaze {
    const key = `${regionX},${regionY}`;
    const carved = this.carvedRegions.get(key);
    if (carved) return carved;
    if (this.carvedRegions.size >= REGIONS_KEPT) this.carvedRegions.clear();
    const fresh = this.carveRegion(regionX, regionY);
    this.carvedRegions.set(key, fresh);
    return fresh;
  }

  private carveRegion(regionX: number, regionY: number): CellMaze {
    const maze = carveCellMaze(
      this.cells(),
      this.knobs.carver,
      this.stream(regionX, regionY, 'carve'),
    );
    braidCellMaze(maze, this.knobs.braid, this.stream(regionX, regionY, 'braid'));
    return maze;
  }

  private borderDoors(regionX: number, regionY: number, edge: string): Set<number> {
    const rng = this.stream(regionX, regionY, `${edge} doors`);
    const order = Array.from({ length: this.cells() }, (_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    return new Set(order.slice(0, Math.min(this.knobs.doorsPerEdge, order.length)));
  }

  private stream(regionX: number, regionY: number, label: string) {
    return mulberry32(hashString(`${this.knobs.seed}:roomMaze:${regionX},${regionY}:${label}`));
  }
}
