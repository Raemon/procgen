'use client';

import { Button } from '@/features/app-shell/controls/Button';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import type { LabRunDetail, LabRunSummary, TrainRequest } from './labClient';
import { clockText, elapsedMsOf, etaSecondsOf, progressShare } from './labProgress';

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

export function LabRunBar({
  form,
  runs,
  run,
  chosenId,
  onForm,
  onChoose,
  onStart,
  onStop,
}: {
  form: TrainForm;
  runs: LabRunSummary[];
  run: LabRunDetail | null;
  chosenId: string | null;
  onForm: (form: TrainForm) => void;
  onChoose: (id: string) => void;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded border border-panel-edge bg-panel px-3 py-2">
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
      <Button onClick={onStart}>start</Button>
      <Button onClick={onStop} disabled={run?.status !== 'running'}>
        stop
      </Button>
      <RunProgress run={run} />
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

function RunProgress({ run }: { run: LabRunDetail | null }) {
  if (!run) return <span className="text-[11px] text-ink-dim">nothing running</span>;
  const elapsed = elapsedMsOf(run.started_at, run.finished_at, Date.now());
  const eta = etaSecondsOf(run.progress.done, run.progress.total, elapsed);
  return (
    <div className="flex flex-col gap-1 text-[11px] text-ink-dim">
      <span>
        {run.status} · {run.progress.done}/{run.progress.total} candidates ·{' '}
        {run.generations_done} generations · {run.elites} elites · coverage{' '}
        {run.coverage.toFixed(3)}
      </span>
      <span>
        elapsed {clockText(elapsed / 1000)}
        {eta === null ? '' : ` · about ${clockText(eta)} left`}
        {run.error === null ? '' : ` · ${run.error}`}
      </span>
      <span className="block h-1 w-48 bg-field">
        <span
          className="block h-full bg-accent"
          style={{ width: `${progressShare(run.progress.done, run.progress.total) * 100}%` }}
        />
      </span>
    </div>
  );
}
