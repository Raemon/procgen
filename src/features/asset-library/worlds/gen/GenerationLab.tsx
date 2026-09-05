'use client';

import { useEffect, useState } from 'react';
import '../nodes';
import { EliteGrid } from './EliteGrid';
import { GenerationStrip } from './GenerationStrip';
import {
  installLabWorldSeeds,
  startTrainingRun,
  stopLabRun,
  type LabRunDetail,
  type LabRunSummary,
} from './labClient';
import { LabRunBar, trainRequestOf, type TrainForm } from './LabRunBar';
import { TrajectoryChart } from './TrajectoryChart';
import { useLabRun, useLabRuns, type LabPoll } from './useLabRun';

const STARTING_FORM: TrainForm = {
  generations: 20,
  batchSize: 8,
  stepBudget: 350,
  radiusCap: 140,
  patience: 12,
  seed: '',
};

export function GenerationLab() {
  const [form, setForm] = useState<TrainForm>(STARTING_FORM);
  const [started, setStarted] = useState(0);
  const [starting, setStarting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [justStarted, setJustStarted] = useState<LabRunSummary | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [installedNames, setInstalledNames] = useState(new Map<string, string>());
  const runsPoll = useLabRuns(started);
  const runs = runsPoll.value;
  const runPoll = useLabRun(chosenId ?? newestTrainRunOf(runs));
  const run = runPoll.value;
  const [ticked, setTicked] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTicked((each) => each + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = async () => {
    setStarting(true);
    setFailure(null);
    const answer = await startTrainingRun(trainRequestOf(form));
    setStarting(false);
    if (answer.run === null) {
      setFailure(`could not start a run — ${answer.failure}`);
      return;
    }
    setInstalledNames(new Map());
    setJustStarted(answer.run);
    setChosenId(answer.run.id);
    setStarted((each) => each + 1);
  };

  const stop = async () => {
    if (!run) return;
    const refused = await stopLabRun(run.id);
    setFailure(refused === null ? null : `could not stop ${run.id} — ${refused}`);
  };

  const install = async (name: string) => {
    if (!run) return;
    const installed = await installLabWorldSeeds(run.id, [name]);
    const saved = installed[0];
    if (saved) setInstalledNames(new Map(installedNames).set(name, saved.name));
  };

  const shownPoll = pollShowing(runPoll, justStarted, chosenId);

  return (
    <main className="min-h-full bg-bg p-4 text-ink" data-ticked={ticked}>
      <div className="mx-auto flex max-w-[110rem] flex-col gap-3">
        <header className="flex items-baseline gap-3">
          <h1 className="text-sm text-accent">generation lab</h1>
          <a className="text-[11px] text-ink-dim underline underline-offset-4" href="/">
            back to the editor
          </a>
          <span className="text-[11px] text-ink-dim">
            the generator and the grader, generation by generation
          </span>
        </header>
        <LabRunBar
          form={form}
          runs={runsWith(runs, justStarted)}
          poll={shownPoll}
          chosenId={run?.id ?? chosenId}
          starting={starting}
          failure={failure ?? runsPoll.failure}
          onForm={setForm}
          onChoose={setChosenId}
          onStart={() => void start()}
          onStop={() => void stop()}
        />
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[3fr_2fr]">
          <div className="rounded border border-panel-edge bg-panel p-2">
            <h2 className="mb-1 text-[11px] text-ink-dim">overall trajectory</h2>
            <TrajectoryChart
              generations={run?.generations ?? []}
              patience={run?.settings.patience ?? form.patience}
            />
          </div>
          <div className="rounded border border-panel-edge bg-panel p-2">
            <h2 className="mb-1 text-[11px] text-ink-dim">
              candidates, newest generation first
            </h2>
            <GenerationStrip
              generations={run?.generations ?? []}
              batchSize={run?.settings.batch_size ?? form.batchSize}
            />
          </div>
        </section>
        <section className="rounded border border-panel-edge bg-panel p-2">
          <h2 className="mb-2 text-[11px] text-ink-dim">
            elite archive, ranked by fun ({run?.world_seeds.length ?? 0} world seeds)
          </h2>
          <EliteGrid
            worldSeeds={run?.world_seeds ?? []}
            installedNames={installedNames}
            onInstall={(name) => void install(name)}
          />
        </section>
      </div>
    </main>
  );
}

function pollShowing(
  poll: LabPoll<LabRunDetail | null>,
  justStarted: LabRunSummary | null,
  chosenId: string | null,
): LabPoll<LabRunDetail | null> {
  if (poll.value !== null || justStarted === null || justStarted.id !== chosenId) return poll;
  return { ...poll, value: detailAwaitingItsFirstPoll(justStarted) };
}

function detailAwaitingItsFirstPoll(summary: LabRunSummary): LabRunDetail {
  return { ...summary, batch: null, world_seeds: [], generations: [], installed: [] };
}

function runsWith(runs: LabRunSummary[], justStarted: LabRunSummary | null): LabRunSummary[] {
  if (justStarted === null || runs.some((each) => each.id === justStarted.id)) return runs;
  return [...runs, justStarted];
}

function newestTrainRunOf(runs: LabRunSummary[]): string | null {
  const trained = runs.filter((run) => run.kind === 'train');
  return trained[trained.length - 1]?.id ?? runs[runs.length - 1]?.id ?? null;
}
