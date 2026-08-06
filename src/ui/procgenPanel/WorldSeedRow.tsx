import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import { KnobRow } from '../controls/KnobRow';

const MAX_RANDOM_SEED = 1_000_000;

export function WorldSeedRow() {
  const { store } = useAppRuntime();
  const [draft, setDraft] = useState<string | null>(null);

  function typeSeed(text: string): void {
    setDraft(text);
    if (Number.isFinite(Number(text)) && text.trim()) store.setSeed(Number(text));
  }

  function rollSeed(): void {
    setDraft(null);
    store.setSeed(Math.floor(Math.random() * MAX_RANDOM_SEED));
  }

  return (
    <KnobRow label="seed">
      <input
        type="number"
        className={classes(FIELD_CLASSES, 'w-full min-w-0')}
        value={draft ?? String(store.seed())}
        onChange={(event) => typeSeed(event.target.value)}
        onBlur={() => setDraft(null)}
      />
      <Button className="px-2 py-[3px]" title="randomize seed" onClick={rollSeed}>
        🎲
      </Button>
    </KnobRow>
  );
}
