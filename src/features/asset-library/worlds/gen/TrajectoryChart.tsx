'use client';

import { useState } from 'react';
import type { GenerationRecord } from '../selfPlay/trainingRunner';
import {
  barHeightOf,
  CHART_FRAME,
  indexAtX,
  patienceShare,
  plotHeight,
  plotWidth,
  sharePath,
  trajectoryPointsOf,
  xOfIndex,
  yOfShare,
  type TrajectoryPoint,
} from './trajectoryScales';

const BAR_BAND = 26;
const SERIES = [
  { label: 'archive best', ink: '#ffd86a', of: (point: TrajectoryPoint) => point.archiveBestFun },
  { label: 'batch best', ink: '#8ae08a', of: (point: TrajectoryPoint) => point.batchBestFun },
  { label: 'batch mean', ink: '#6aa9ff', of: (point: TrajectoryPoint) => point.batchMeanFun },
];

export function TrajectoryChart({
  generations,
  patience,
}: {
  generations: GenerationRecord[];
  patience: number;
}) {
  const points = trajectoryPointsOf(generations);
  const [hovered, setHovered] = useState<number | null>(null);
  if (points.length === 0) {
    return <p className="text-[11px] text-ink-dim">no generation has landed yet</p>;
  }
  const shown = points[hovered ?? points.length - 1]!;
  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${CHART_FRAME.width} ${CHART_FRAME.height + BAR_BAND}`}
        className="w-full"
        onMouseLeave={() => setHovered(null)}
        onMouseMove={(event) => setHovered(hoveredIndex(event, points.length))}
      >
        <Gridlines />
        {SERIES.map((series) => (
          <path
            key={series.label}
            d={sharePath(CHART_FRAME, points.map(series.of))}
            fill="none"
            stroke={series.ink}
            strokeWidth={1.5}
          />
        ))}
        <path
          d={sharePath(CHART_FRAME, points.map((point) => point.coverage))}
          fill="none"
          stroke="#c58aff"
          strokeDasharray="4 3"
          strokeWidth={1.5}
        />
        <AdmissionBars points={points} />
        <line
          x1={xOfIndex(CHART_FRAME, points.length, hovered ?? points.length - 1)}
          x2={xOfIndex(CHART_FRAME, points.length, hovered ?? points.length - 1)}
          y1={CHART_FRAME.padTop}
          y2={CHART_FRAME.padTop + plotHeight(CHART_FRAME) + BAR_BAND}
          stroke="#2a3a55"
        />
      </svg>
      <Legend />
      <GenerationReadout point={shown} patience={patience} />
    </div>
  );
}

function hoveredIndex(
  event: { currentTarget: SVGSVGElement; clientX: number },
  count: number,
): number {
  const box = event.currentTarget.getBoundingClientRect();
  const scaled = ((event.clientX - box.left) / box.width) * CHART_FRAME.width;
  return indexAtX(CHART_FRAME, count, scaled);
}

function Gridlines() {
  return (
    <g>
      {[0, 0.25, 0.5, 0.75, 1].map((share) => (
        <g key={share}>
          <line
            x1={CHART_FRAME.padLeft}
            x2={CHART_FRAME.padLeft + plotWidth(CHART_FRAME)}
            y1={yOfShare(CHART_FRAME, share)}
            y2={yOfShare(CHART_FRAME, share)}
            stroke="#1d2635"
          />
          <text
            x={CHART_FRAME.padLeft - 6}
            y={yOfShare(CHART_FRAME, share) + 3}
            textAnchor="end"
            fontSize={9}
            fill="#7a8698"
          >
            {share.toFixed(2)}
          </text>
        </g>
      ))}
    </g>
  );
}

function AdmissionBars({ points }: { points: TrajectoryPoint[] }) {
  const most = Math.max(1, ...points.map((point) => point.admissions));
  const floor = CHART_FRAME.padTop + plotHeight(CHART_FRAME) + BAR_BAND;
  const width = Math.max(1, Math.min(9, plotWidth(CHART_FRAME) / Math.max(points.length, 1) - 1));
  return (
    <g>
      {points.map((point, at) => {
        const height = barHeightOf(point.admissions, most, BAR_BAND - 4);
        return (
          <rect
            key={point.generation}
            x={xOfIndex(CHART_FRAME, points.length, at) - width / 2}
            y={floor - height}
            width={width}
            height={height}
            fill="#3f6f9f"
          />
        );
      })}
    </g>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] text-ink-dim">
      {SERIES.map((series) => (
        <span key={series.label} className="flex items-center gap-1">
          <span className="inline-block h-[2px] w-4" style={{ background: series.ink }} />
          {series.label}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="inline-block h-[2px] w-4 bg-[#c58aff]" />
        archive coverage
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-2 w-2 bg-[#3f6f9f]" />
        admissions
      </span>
    </div>
  );
}

function GenerationReadout({ point, patience }: { point: TrajectoryPoint; patience: number }) {
  const share = patienceShare(point.generationsSinceGain, patience);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-dim">
      <span className="text-ink">generation {point.generation}</span>
      <span>archive best {point.archiveBestFun.toFixed(3)}</span>
      <span>batch best {point.batchBestFun.toFixed(3)}</span>
      <span>batch mean {point.batchMeanFun.toFixed(3)}</span>
      <span>coverage {point.coverage.toFixed(3)}</span>
      <span>admitted {point.admissions}</span>
      <span className="flex items-center gap-1">
        patience {point.generationsSinceGain}/{patience}
        <span className="inline-block h-2 w-16 border border-panel-edge">
          <span
            className="block h-full"
            style={{ width: `${share * 100}%`, background: patienceInk(share) }}
          />
        </span>
      </span>
    </div>
  );
}

function patienceInk(share: number): string {
  if (share > 0.75) return '#ff8080';
  if (share > 0.4) return '#ffb066';
  return '#3f6f9f';
}
