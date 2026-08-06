import type { LatentReport } from '../../latents/latentTypes';

export const CLUSTER_COLORS = [
  '#4a90d9',
  '#7fb069',
  '#c9a227',
  '#b56576',
  '#9b6bcc',
  '#e07a5f',
  '#8d8d88',
  '#5aa9a2',
] as const;

const MAP_SIDE = 64;

export function LatentMiniMap({ report }: { report: LatentReport }) {
  const rows = downsampledRows(report);
  return (
    <pre className="overflow-x-auto text-[7px] leading-[7px]">
      {rows.map((row, y) => (
        <div key={y}>
          {row.map((segment, i) => (
            <span key={i} style={{ color: CLUSTER_COLORS[segment.cluster % CLUSTER_COLORS.length] }}>
              {'█'.repeat(segment.length)}
            </span>
          ))}
        </div>
      ))}
    </pre>
  );
}

interface RowSegment {
  cluster: number;
  length: number;
}

function downsampledRows(report: LatentReport): RowSegment[][] {
  const scale = Math.max(1, Math.floor(report.cellsPerSide / MAP_SIDE));
  const side = Math.floor(report.cellsPerSide / scale);
  const rows: RowSegment[][] = [];
  for (let y = 0; y < side; y++) {
    rows.push(segmentsOfRow(report, y, side, scale));
  }
  return rows;
}

function segmentsOfRow(report: LatentReport, y: number, side: number, scale: number): RowSegment[] {
  const segments: RowSegment[] = [];
  for (let x = 0; x < side; x++) {
    const cluster = majorityClusterInBlock(report, x * scale, y * scale, scale);
    const last = segments[segments.length - 1];
    if (last && last.cluster === cluster) last.length++;
    else segments.push({ cluster, length: 1 });
  }
  return segments;
}

function majorityClusterInBlock(report: LatentReport, originX: number, originY: number, scale: number): number {
  const tally = new Map<number, number>();
  for (let dy = 0; dy < scale; dy++) {
    for (let dx = 0; dx < scale; dx++) {
      const cluster = report.assignment[(originY + dy) * report.cellsPerSide + originX + dx]!;
      tally.set(cluster, (tally.get(cluster) ?? 0) + 1);
    }
  }
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}
