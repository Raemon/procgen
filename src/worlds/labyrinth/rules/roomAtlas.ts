import { buildPuzzleRoom } from '../generate/rooms/buildPuzzleRoom';
import type { PuzzleRoomLayout } from '../generate/rooms/puzzleRoomLayout';
import { RoomCache } from '../generate/rooms/roomCache';
import { labyrinthCellCoordOf, labyrinthCellKey } from '../generate/layout/labyrinthLattice';
import type { LabyrinthKnobs } from '../node/labyrinthKnobs';

const ROOMS_KEPT = 512;

export class RoomAtlas {
  private readonly built = new RoomCache(ROOMS_KEPT);

  constructor(private readonly knobs: LabyrinthKnobs | null) {}

  isActive(): boolean {
    return this.knobs !== null;
  }

  inCell(roomX: number, roomY: number): PuzzleRoomLayout | null {
    if (!this.knobs) return null;
    const key = labyrinthCellKey(roomX, roomY);
    const known = this.built.get(key);
    if (known) return known;
    const furnished = buildPuzzleRoom(this.knobs, roomX, roomY);
    this.built.set(key, furnished);
    return furnished;
  }

  at(x: number, y: number): PuzzleRoomLayout | null {
    return this.inCell(labyrinthCellCoordOf(x), labyrinthCellCoordOf(y));
  }

  overlapping(minX: number, minY: number, maxX: number, maxY: number): PuzzleRoomLayout[] {
    const layouts: PuzzleRoomLayout[] = [];
    for (let roomY = labyrinthCellCoordOf(minY); roomY <= labyrinthCellCoordOf(maxY); roomY++) {
      for (let roomX = labyrinthCellCoordOf(minX); roomX <= labyrinthCellCoordOf(maxX); roomX++) {
        const layout = this.inCell(roomX, roomY);
        if (layout) layouts.push(layout);
      }
    }
    return layouts;
  }
}
