'use client';

import { useEffect, useState } from 'react';
import '../nodes';
import { EliteGrid } from './EliteGrid';
import { GenerationStrip } from './GenerationStrip';
import { installLabWorldSeeds, startTrainingRun, stopLabRun, type LabRunSummary } from './labClient';
import { LabRunBar, trainRequestOf, type TrainForm } from './LabRunBar';
import { TrajectoryChart } from './TrajectoryChart';
import { useLabRun, useLabRuns } from './useLabRun';

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
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [installedNames, setInstalledNames] = useState(new Map<string, string>());
  const runs = useLabRuns(started);
  const run = useLabRun(chosenId ?? newestTrainRunOf(runs));
  const [ticked, setTicked] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTicked((each) => each + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = async () => {
    const fresh = await startTrainingRun(trainRequestOf(form));
    if (!fresh) return;
    setInstalledNames(new Map());
    setChosenId(fresh.id);
    setStarted((each) => each + 1);
  };

  const install = async (name: string) => {
    if (!run) return;
    const installed = await installLabWorldSeeds(run.id, [name]);
    const saved = installed[0];
    if (saved) setInstalledNames(new Map(installedNames).set(name, saved.name));
  };

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
          runs={runs}
          run={run}
          chosenId={run?.id ?? chosenId}
          onForm={setForm}
          onChoose={setChosenId}
          onStart={() => void start()}
          onStop={() => run && void stopLabRun(run.id)}
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
            elite archive, ranked by fun ({run?.worlds.length ?? 0} worlds)
          </h2>
          <EliteGrid
            worlds={run?.worlds ?? []}
            installedNames={installedNames}
            onInstall={(name) => void install(name)}
          />
        </section>
      </div>
    </main>
  );
}

function newestTrainRunOf(runs: LabRunSummary[]): string | null {
  const trained = runs.filter((run) => run.kind === 'train');
  return trained[trained.length - 1]?.id ?? runs[runs.length - 1]?.id ?? null;
}
