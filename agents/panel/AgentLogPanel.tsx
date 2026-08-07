import { useEffect, useRef } from 'react';
import { classes } from '../../frontend/controls/classes';
import { HINT_CLASSES } from '../../frontend/controls/fieldClasses';
import type { WireTranscriptEntry } from './agentsApiClient';
import { useTranscript } from './useTranscript';

const ENTRY_INKS: Readonly<Record<WireTranscriptEntry['type'], string>> = {
  status: 'text-center text-[10px] uppercase tracking-wide text-ink-dim',
  thinking: 'italic text-ink-dim',
  message: 'text-ink',
  tool_use: 'text-sky-400',
  tool_result: 'text-sky-400/60',
  error: 'text-amber-400',
};

export function AgentLogPanel({ selectedId }: { selectedId: string }) {
  const { entries, runStatus } = useTranscript(selectedId);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => scrollOwnPanelToBottom(bottom.current), [entries.length]);
  return (
    <>
      {runStatus && <p className={`${HINT_CLASSES} mb-1.5`}>run · {runStatus}</p>}
      {entries.length === 0 ? (
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

function scrollOwnPanelToBottom(anchor: HTMLElement | null): void {
  const panel = scrollingAncestorOf(anchor);
  if (panel) panel.scrollTop = panel.scrollHeight;
}

function scrollingAncestorOf(element: HTMLElement | null): HTMLElement | null {
  for (let node = element?.parentElement ?? null; node !== null; node = node.parentElement) {
    if (node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}
