'use client';

import { useState } from 'react';
import type { CandidateRecord } from '../selfPlay/candidateRecord';
import type { GenerationRecord } from '../selfPlay/trainingRunner';
import { CANDIDATE_ORIGINS, originInk } from './candidateOrigins';

const BAR_HEIGHT_PX = 34;
const BAR_WIDTH_PX = 14;

export function GenerationStrip({
  generations,
  batchSize,
}: {
  generations: GenerationRecord[];
  batchSize: number;
}) {
  const [chosen, setChosen] = useState<{ generation: number; at: number } | null>(null);
  const newestFirst = [...generations].reverse();
  return (
    <div className="flex flex-col gap-2">
      <OriginLegend />
      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
        {newestFirst.map((record) => (
          <GenerationRow
            key={record.generation}
            record={record}
            batchSize={batchSize}
            chosenAt={chosen?.generation === record.generation ? chosen.at : null}
            onChoose={(at) => setChosen({ generation: record.generation, at })}
          />
        ))}
      </div>
      <CandidatePanel candidate={chosenCandidate(generations, chosen)} />
    </div>
  );
}

function chosenCandidate(
  generations: GenerationRecord[],
  chosen: { generation: number; at: number } | null,
): CandidateRecord | null {
  if (!chosen) return null;
  const record = generations.find((each) => each.generation === chosen.generation);
  return record?.candidates[chosen.at] ?? null;
}

function GenerationRow({
  record,
  batchSize,
  chosenAt,
  onChoose,
}: {
  record: GenerationRecord;
  batchSize: number;
  chosenAt: number | null;
  onChoose: (at: number) => void;
}) {
  const pending = Math.max(0, batchSize - record.candidates.length);
  return (
    <div className="flex items-end gap-2">
      <span className="w-8 shrink-0 text-right text-[10px] text-ink-dim">{record.generation}</span>
      <div className="flex items-end gap-[3px]" style={{ height: BAR_HEIGHT_PX }}>
        {record.candidates.map((candidate, at) => (
          <CandidateBar
            key={at}
            candidate={candidate}
            chosen={chosenAt === at}
            onChoose={() => onChoose(at)}
          />
        ))}
        {Array.from({ length: pending }, (_slot, at) => (
          <span
            key={`pending-${at}`}
            className="self-end border border-dashed border-panel-edge"
            style={{ width: BAR_WIDTH_PX, height: 6 }}
          />
        ))}
      </div>
      <span className="text-[10px] text-ink-dim">
        {record.admissions > 0 ? `+${record.admissions}` : ''}
      </span>
    </div>
  );
}

function CandidateBar({
  candidate,
  chosen,
  onChoose,
}: {
  candidate: CandidateRecord;
  chosen: boolean;
  onChoose: () => void;
}) {
  const ink = originInk(candidate.origin);
  const height = Math.max(3, Math.round((candidate.fun ?? 0) * BAR_HEIGHT_PX));
  return (
    <button
      type="button"
      title={`${candidate.name} — ${candidate.origin}${candidate.fun === null ? '' : ` ${candidate.fun.toFixed(3)}`}`}
      onClick={onChoose}
      className="relative cursor-pointer"
      style={{
        width: BAR_WIDTH_PX,
        height: candidate.walkable ? height : BAR_HEIGHT_PX,
        border: `1px solid ${candidate.walkable ? ink : '#a04040'}`,
        background: candidate.admitted ? ink : 'transparent',
        outline: chosen ? '1px solid #cdd6e4' : 'none',
      }}
    >
      {candidate.walkable ? null : (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-danger-ink">
          ×
        </span>
      )}
    </button>
  );
}

function OriginLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] text-ink-dim">
      {CANDIDATE_ORIGINS.map((origin) => (
        <span key={origin} className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2"
            style={{ background: originInk(origin), border: `1px solid ${originInk(origin)}` }}
          />
          {origin}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="inline-block h-2 w-2 border border-btn-edge" />
        rejected
      </span>
      <span className="flex items-center gap-1">
        <span className="text-danger-ink">×</span>
        nowhere to walk
      </span>
    </div>
  );
}

function CandidatePanel({ candidate }: { candidate: CandidateRecord | null }) {
  if (!candidate) {
    return <p className="text-[11px] text-ink-dim">click a candidate to read what it scored</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-panel-edge bg-panel px-2 py-1 text-[11px] text-ink-dim">
      <span className="text-ink">{candidate.name}</span>
      <span style={{ color: originInk(candidate.origin) }}>{candidate.origin}</span>
      <span>{candidate.fun === null ? 'no walk' : `fun ${candidate.fun.toFixed(3)}`}</span>
      <span>{candidate.admitted ? 'admitted to the archive' : 'not admitted'}</span>
      {candidate.parents.length > 0 ? <span>from {candidate.parents.join(' × ')}</span> : null}
      {candidate.weakest.length > 0 ? <span>weakest: {candidate.weakest.join(', ')}</span> : null}
    </div>
  );
}
