import { useEffect, useState } from 'react';
import { fetchLabRun, fetchLabRuns, type LabRunDetail, type LabRunSummary } from './labClient';

const POLL_WHILE_RUNNING_MS = 1000;
const POLL_WHILE_IDLE_MS = 5000;

export function useLabRuns(watched: number): LabRunSummary[] {
  const [runs, setRuns] = useState<LabRunSummary[]>([]);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const pollAgain = async () => {
      const listed = await fetchLabRuns();
      if (!alive) return;
      setRuns(listed);
      timer = setTimeout(() => void pollAgain(), pollGapOf(listed.some(isRunning)));
    };
    void pollAgain();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [watched]);
  return runs;
}

export function useLabRun(id: string | null): LabRunDetail | null {
  const [run, setRun] = useState<LabRunDetail | null>(null);
  useEffect(() => {
    if (id === null) {
      setRun(null);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const pollAgain = async () => {
      const detail = await fetchLabRun(id);
      if (!alive) return;
      setRun(detail);
      timer = setTimeout(() => void pollAgain(), pollGapOf(detail !== null && isRunning(detail)));
    };
    void pollAgain();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);
  return run;
}

function isRunning(run: { status: string }): boolean {
  return run.status === 'running';
}

function pollGapOf(running: boolean): number {
  return running ? POLL_WHILE_RUNNING_MS : POLL_WHILE_IDLE_MS;
}
