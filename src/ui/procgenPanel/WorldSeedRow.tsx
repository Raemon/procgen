import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import { KnobRow } from '../controls/KnobRow';
import { ROLL_SEED_TIP, SEED_TIP } from './help/pipelineTips';

const MAX_RANDOM_SEED = 1_000_000;

export function WorldSeedRow() {
  const { store, perform } = useAppRuntime();
  const [draft, setDraft] = useState<string | null>(null);

  function typeSeed(text: string): void {
    setDraft(text);
    if (Number.isFinite(Number(text)) && text.trim()) perform('set_seed', { seed: Number(text) });
  }

  function rollSeed(): void {
    setDraft(null);
    perform('set_seed', { seed: Math.floor(Math.random() * MAX_RANDOM_SEED) });
  }

  return (
    <KnobRow label="seed" tip={SEED_TIP}>
      <input
        type="number"
        className={classes(FIELD_CLASSES, 'w-full min-w-0')}
        value={draft ?? String(store.seed())}
        onChange={(event) => typeSeed(event.target.value)}
        onBlur={() => setDraft(null)}
        aria-label="world seed"
      />
      <Button className="px-2 py-[3px]" tip={ROLL_SEED_TIP} onClick={rollSeed}>
        🎲
      </Button>
    </KnobRow>
  );
}
