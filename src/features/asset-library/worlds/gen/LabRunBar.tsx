'use client';

import { Button } from '@/features/app-shell/controls/Button';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import type { LabRunDetail, LabRunSummary, TrainRequest } from './labClient';
import { clockText, elapsedMsOf, etaSecondsOf, progressShare } from './labProgress';
import { lastCandidateLine, paceLine, phaseLine, stalenessLine } from './labPhase';
import type { LabPoll } from './useLabRun';

export interface TrainForm {
  generations: number;
  batchSize: number;
  stepBudget: number;
  radiusCap: number;
  patience: number;
  seed: string;
}

export const TRAIN_FORM_FIELDS: { key: keyof TrainForm; label: string }[] = [
  { key: 'generations', label: 'generations' },
  { key: 'batchSize', label: 'batch size' },
  { key: 'stepBudget', label: 'step budget' },
  { key: 'radiusCap', label: 'radius cap' },
  { key: 'patience', label: 'patience' },
  { key: 'seed', label: 'seed' },
];

export function trainRequestOf(form: TrainForm): TrainRequest {
  const seed = Number(form.seed);
  return {
    generations: form.generations,
    batch_size: form.batchSize,
    step_budget: form.stepBudget,
    radius_cap: form.radiusCap,
    patience: form.patience,
    ...(form.seed.trim() === '' || !Number.isFinite(seed) ? {} : { seed }),
  };
}

export function plannedWorkText(form: TrainForm): string {
  return `${form.generations} generations × ${form.batchSize} candidates = ${form.generations * form.batchSize} worlds to grow and walk`;
}

export function LabRunBar({
  form,
  runs,
  poll,
  chosenId,
  starting,
  failure,
  onForm,
  onChoose,
  onStart,
  onStop,
}: {
  form: TrainForm;
  runs: LabRunSummary[];
  poll: LabPoll<LabRunDetail | null>;
  chosenId: string | null;
  starting: boolean;
  failure: string | null;
  onForm: (form: TrainForm) => void;
  onChoose: (id: string) => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const run = poll.value;
  return (
    <div className="flex flex-col gap-2 rounded border border-panel-edge bg-panel px-3 py-2">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[10px] text-ink-dim">
          run
          <select
            className={FIELD_CLASSES}
            value={chosenId ?? ''}
            onChange={(event) => onChoose(event.target.value)}
          >
            {runs.length === 0 ? <option value="">no run yet</option> : null}
            {[...runs].reverse().map((each) => (
              <option key={each.id} value={each.id}>
                {runLabel(each)}
              </option>
            ))}
          </select>
        </label>
        {TRAIN_FORM_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-[10px] text-ink-dim">
            {field.label}
            <input
              className={`${FIELD_CLASSES} w-20`}
              value={String(form[field.key])}
              placeholder={field.key === 'seed' ? 'random' : ''}
              onChange={(event) => onForm(withField(form, field.key, event.target.value))}
            />
          </label>
        ))}
        <Button onClick={onStart} disabled={starting}>
          {starting ? 'starting…' : 'start'}
        </Button>
        <Button onClick={onStop} disabled={run?.status !== 'running'}>
          stop
        </Button>
        <RunProgress run={run} poll={poll} starting={starting} form={form} />
      </div>
      {failure === null ? null : <p className="text-[11px] text-danger-ink">{failure}</p>}
    </div>
  );
}

function withField(form: TrainForm, key: keyof TrainForm, raw: string): TrainForm {
  if (key === 'seed') return { ...form, seed: raw };
  const value = Number(raw.replace(/[^0-9]/g, ''));
  return { ...form, [key]: Number.isFinite(value) ? value : 0 };
}

function runLabel(run: LabRunSummary): string {
  const best = run.best_fun === null ? 'no world yet' : `best ${run.best_fun.toFixed(3)}`;
  return `${run.id} ${run.kind} ${run.status} ${run.progress.done}/${run.progress.total} ${best}`;
}

function RunProgress({
  run,
  poll,
  starting,
  form,
}: {
  run: LabRunDetail | null;
  poll: LabPoll<LabRunDetail | null>;
  starting: boolean;
  form: TrainForm;
}) {
  const now = Date.now();
  if (starting) {
    return (
      <div className="flex flex-col gap-1 text-[11px] text-ink-dim">
        <span className="text-accent">asking the lab to open a run…</span>
        <span>{plannedWorkText(form)}</span>
      </div>
    );
  }
  if (!run) {
    return (
      <div className="flex flex-col gap-1 text-[11px] text-ink-dim">
        <span>nothing running — press start</span>
        <span>{plannedWorkText(form)}</span>
      </div>
    );
  }
  const elapsed = elapsedMsOf(run.started_at, run.finished_at, now);
  const eta = etaSecondsOf(run.progress.done, run.progress.total, elapsed);
  const stale = stalenessLine(poll.answeredAt, poll.waitingSince, now);
  const last = lastCandidateLine(run.generations);
  const pace = paceLine(run.progress.done, elapsed);
  return (
    <div className="flex flex-col gap-1 text-[11px] text-ink-dim">
      <span>
        {run.status} · {run.progress.done}/{run.progress.total} candidates ·{' '}
        {run.generations_done} generations · {run.elites} elites · coverage{' '}
        {run.coverage.toFixed(3)}
      </span>
      <span className="text-ink">{phaseLine(run)}</span>
      {last === null ? null : <span>{last}</span>}
      <span>
        elapsed {clockText(elapsed / 1000)}
        {eta === null ? '' : ` · about ${clockText(eta)} left`}
        {pace === null ? '' : ` · ${pace}`}
        {run.error === null ? '' : ` · ${run.error}`}
      </span>
      {stale === null ? null : <span className="text-accent">{stale}</span>}
      {poll.failure === null ? null : (
        <span className="text-danger-ink">poll failed: {poll.failure}</span>
      )}
      <span className="block h-1 w-48 bg-field">
        <span
          className="block h-full bg-accent"
          style={{ width: `${progressShare(run.progress.done, run.progress.total) * 100}%` }}
        />
      </span>
    </div>
  );
}
