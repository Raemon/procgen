import { useState } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { classes } from '../../frontend/controls/classes';
import { FIELD_CLASSES } from '../../frontend/controls/fieldClasses';
import { KnobRow } from '../../frontend/controls/KnobRow';
import { TIME_TIP } from './help/pipelineTips';

export function WorldTimeRow() {
  const { store, perform } = useAppRuntime();
  const [draft, setDraft] = useState<string | null>(null);

  function typeTime(text: string): void {
    setDraft(text);
    if (Number.isFinite(Number(text)) && text.trim()) perform('set_time', { time: Number(text) });
  }

  return (
    <KnobRow label="time" tip={TIME_TIP}>
      <input
        type="number"
        className={classes(FIELD_CLASSES, 'w-full min-w-0')}
        value={draft ?? String(store.time())}
        onChange={(event) => typeTime(event.target.value)}
        onBlur={() => setDraft(null)}
        aria-label="world time"
      />
    </KnobRow>
  );
}
