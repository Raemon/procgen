export interface OccluderBox {
  bottom: number;
  top: number;
  width: number;
}

const COVERAGE_TOLERANCE = 1e-6;

export function coveringRuns(boxes: readonly OccluderBox[], width: number): OccluderBox[] {
  return mergedRuns(boxesAtLeastAsWide(boxes, width));
}

export function runsCoverSpan(runs: readonly OccluderBox[], span: OccluderBox): boolean {
  for (const run of runs) {
    if (run.bottom <= span.bottom + COVERAGE_TOLERANCE && run.top >= span.top - COVERAGE_TOLERANCE)
      return true;
  }
  return false;
}

function boxesAtLeastAsWide(boxes: readonly OccluderBox[], width: number): OccluderBox[] {
  return boxes
    .filter((box) => box.width >= width - COVERAGE_TOLERANCE)
    .sort((a, b) => a.bottom - b.bottom);
}

function mergedRuns(sorted: readonly OccluderBox[]): OccluderBox[] {
  const runs: OccluderBox[] = [];
  for (const box of sorted) {
    const open = runs[runs.length - 1];
    if (open && box.bottom <= open.top + COVERAGE_TOLERANCE) open.top = Math.max(open.top, box.top);
    else runs.push({ ...box });
  }
  return runs;
}
