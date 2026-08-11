import { coveringRuns, runsCoverSpan, type OccluderBox } from './occluderBox';

interface OccludedCell {
  boxes: OccluderBox[];
  runsByWidth: Map<number, OccluderBox[]>;
}

export class ChunkOccluderField {
  private readonly cells: (OccludedCell | undefined)[];

  constructor(
    private readonly originX: number,
    private readonly originY: number,
    private readonly span: number,
  ) {
    this.cells = new Array<OccludedCell | undefined>(span * span).fill(undefined);
  }

  addOccluder(x: number, y: number, box: OccluderBox): void {
    const at = this.indexOf(x, y);
    if (at < 0) return;
    const cell: OccludedCell = this.cells[at] ?? {
      boxes: [],
      runsByWidth: new Map<number, OccluderBox[]>(),
    };
    this.cells[at] = cell;
    cell.boxes.push(box);
  }

  sealsSpan(x: number, y: number, span: OccluderBox): boolean {
    const at = this.indexOf(x, y);
    const cell = at < 0 ? undefined : this.cells[at];
    return cell !== undefined && runsCoverSpan(runsOfWidth(cell, span.width), span);
  }

  private indexOf(x: number, y: number): number {
    const column = x - this.originX;
    const row = y - this.originY;
    if (column < 0 || row < 0 || column >= this.span || row >= this.span) return -1;
    return row * this.span + column;
  }
}

function runsOfWidth(cell: OccludedCell, width: number): OccluderBox[] {
  const known = cell.runsByWidth.get(width);
  if (known) return known;
  const runs = coveringRuns(cell.boxes, width);
  cell.runsByWidth.set(width, runs);
  return runs;
}
