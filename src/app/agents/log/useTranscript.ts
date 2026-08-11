import { useEffect, useState } from 'react';
import { fetchTranscript, type WireTranscriptEntry } from './agentsApiClient';

const TRANSCRIPT_POLL_MS = 1000;

export function useTranscript(selectedId: string): {
  entries: WireTranscriptEntry[];
  runStatus: string | null;
} {
  const [entries, setEntries] = useState<WireTranscriptEntry[]>([]);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  useEffect(() => {
    setEntries([]);
    setRunStatus(null);
    let collected: WireTranscriptEntry[] = [];
    let disposed = false;
    async function poll(): Promise<void> {
      const after = collected[collected.length - 1]?.seq ?? 0;
      const update = await fetchTranscript(selectedId, after);
      if (disposed || !update) return;
      if (update.entries.length > 0) {
        collected = [...collected, ...update.entries];
        setEntries(collected);
      }
      setRunStatus(update.run_status);
    }
    void poll();
    const timer = window.setInterval(() => void poll(), TRANSCRIPT_POLL_MS);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [selectedId]);
  return { entries, runStatus };
}
