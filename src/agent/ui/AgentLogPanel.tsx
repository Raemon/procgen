import { useEffect, useRef, useState } from 'react';
import { classes } from '../../ui/controls/classes';
import { HINT_CLASSES, PANEL_HEADING_CLASSES } from '../../ui/controls/fieldClasses';
import { fetchTranscript, type WireTranscriptEntry } from './agentsApiClient';

const TRANSCRIPT_POLL_MS = 1000;
const ENTRY_INKS: Readonly<Record<WireTranscriptEntry['type'], string>> = {
  status: 'text-center text-[10px] uppercase tracking-wide text-ink-dim',
  thinking: 'italic text-ink-dim',
  message: 'text-ink',
  tool_use: 'text-sky-400',
  tool_result: 'text-sky-400/60',
  error: 'text-amber-400',
};

export function AgentLogPanel({ selectedId }: { selectedId: string | null }) {
  const { entries, runStatus } = useTranscript(selectedId);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => bottom.current?.scrollIntoView({ block: 'nearest' }), [entries.length]);
  return (
    <>
      <h2 className={PANEL_HEADING_CLASSES}>agent log {runStatus && `· ${runStatus}`}</h2>
      {selectedId === null ? (
        <p className={HINT_CLASSES}>Select an agent to follow its autopilot transcript.</p>
      ) : entries.length === 0 ? (
        <p className={HINT_CLASSES}>No transcript yet — start a run.</p>
      ) : (
        <div className="flex flex-col gap-1 text-xs">
          {entries.map((entry) => (
            <p key={entry.seq} className={classes('whitespace-pre-wrap', ENTRY_INKS[entry.type])}>
              {entry.text}
            </p>
          ))}
          <div ref={bottom} />
        </div>
      )}
    </>
  );
}

function useTranscript(selectedId: string | null): {
  entries: WireTranscriptEntry[];
  runStatus: string | null;
} {
  const [entries, setEntries] = useState<WireTranscriptEntry[]>([]);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  useEffect(() => {
    setEntries([]);
    setRunStatus(null);
    if (selectedId === null) return;
    let collected: WireTranscriptEntry[] = [];
    let disposed = false;
    async function poll(): Promise<void> {
      const after = collected[collected.length - 1]?.seq ?? 0;
      const update = await fetchTranscript(selectedId!, after);
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
