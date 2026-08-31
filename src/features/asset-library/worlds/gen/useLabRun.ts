import { useEffect, useState } from 'react';
import { fetchLabRun, fetchLabRuns, type LabRunDetail, type LabRunSummary } from './labClient';

const POLL_WHILE_RUNNING_MS = 1000;
const POLL_WHILE_IDLE_MS = 5000;

export interface LabPoll<Value> {
  value: Value;
  answeredAt: number | null;
  waitingSince: number | null;
  failure: string | null;
}

export function useLabRuns(watched: number): LabPoll<LabRunSummary[]> {
  const [poll, setPoll] = useState<LabPoll<LabRunSummary[]>>(pollWaiting([]));
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const pollAgain = async () => {
      setPoll((was) => ({ ...was, waitingSince: was.waitingSince ?? Date.now() }));
      const answer = await fetchLabRuns();
      if (!alive) return;
      const listed = answer.failure === null ? answer.runs : [];
      setPoll((was) => pollAnswered(answer.failure === null ? listed : was.value, answer.failure));
      timer = setTimeout(() => void pollAgain(), pollGapOf(listed.some(isRunning)));
    };
    void pollAgain();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [watched]);
  return poll;
}

export function useLabRun(id: string | null): LabPoll<LabRunDetail | null> {
  const [poll, setPoll] = useState<LabPoll<LabRunDetail | null>>(pollWaiting(null));
  useEffect(() => {
    if (id === null) {
      setPoll(pollWaiting(null));
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const pollAgain = async () => {
      setPoll((was) => ({ ...was, waitingSince: was.waitingSince ?? Date.now() }));
      const answer = await fetchLabRun(id);
      if (!alive) return;
      setPoll((was) => pollAnswered(answer.failure === null ? answer.run : was.value, answer.failure));
      timer = setTimeout(
        () => void pollAgain(),
        pollGapOf(answer.run !== null && isRunning(answer.run)),
      );
    };
    void pollAgain();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [id]);
  return poll;
}

function pollWaiting<Value>(value: Value): LabPoll<Value> {
  return { value, answeredAt: null, waitingSince: null, failure: null };
}

function pollAnswered<Value>(value: Value, failure: string | null): LabPoll<Value> {
  return { value, answeredAt: Date.now(), waitingSince: null, failure };
}

function isRunning(run: { status: string }): boolean {
  return run.status === 'running';
}

function pollGapOf(running: boolean): number {
  return running ? POLL_WHILE_RUNNING_MS : POLL_WHILE_IDLE_MS;
}
