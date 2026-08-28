import { newLabRun, type LabRun, type LabRunKind, type LabStepper } from './labRun';

const MOST_RUNS_REMEMBERED = 20;

export type LabScheduler = (task: () => void) => void;

export class WorldSeedLab {
  private readonly runs: LabRun[] = [];
  private nextId = 1;

  constructor(private readonly runSoon: LabScheduler = setImmediate) {}

  start(kind: LabRunKind, settings: Record<string, number>, stepper: LabStepper): LabRun {
    const run = newLabRun(`lab_${this.nextId++}`, kind, settings, stepper.total, this.now());
    this.runs.push(run);
    this.forgetOldestFinished();
    this.pump(run, stepper);
    return run;
  }

  all(): readonly LabRun[] {
    return this.runs;
  }

  byId(id: string): LabRun | undefined {
    return this.runs.find((run) => run.id === id);
  }

  stop(id: string): LabRun | undefined {
    const run = this.byId(id);
    if (run?.status === 'running') run.stopRequested = true;
    return run;
  }

  private pump(run: LabRun, stepper: LabStepper): void {
    this.runSoon(() => {
      if (this.settled(run, stepper)) return;
      try {
        stepper.step(run);
        run.done++;
      } catch (thrown) {
        this.finishRun(run, 'failed', thrown instanceof Error ? thrown.message : String(thrown));
        return;
      }
      this.pump(run, stepper);
    });
  }

  private settled(run: LabRun, stepper: LabStepper): boolean {
    if (run.stopRequested) {
      stepper.finish(run);
      this.finishRun(run, 'stopped', null);
      return true;
    }
    if (run.done < run.total) return false;
    stepper.finish(run);
    this.finishRun(run, 'done', null);
    return true;
  }

  private finishRun(run: LabRun, status: LabRun['status'], error: string | null): void {
    run.status = status;
    run.error = error;
    run.finishedAt = this.now();
  }

  private forgetOldestFinished(): void {
    while (this.runs.length > MOST_RUNS_REMEMBERED) {
      const oldest = this.runs.findIndex((run) => run.status !== 'running');
      if (oldest < 0) return;
      this.runs.splice(oldest, 1);
    }
  }

  private now(): string {
    return new Date().toISOString();
  }
}
