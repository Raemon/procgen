import { useState } from 'react';
import { Button } from '../../ui/controls/Button';
import { Select } from '../../ui/controls/Select';
import { FIELD_CLASSES, HINT_CLASSES } from '../../ui/controls/fieldClasses';
import type { AgentMode } from '../agentMode';
import { createAgent, deleteAgent, startRun, stopRun, type RosterAgent } from './agentsApiClient';
import { AgentCard } from './AgentCard';
import { storeAnthropicKey, storedAnthropicKey } from './anthropicKeyStore';
import { defaultRunSettings, MODEL_OPTIONS, type RunSettings } from './runSettings';
import { useAgentsRoster } from './useAgentsRoster';

export function AgentsPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect(id: string | null): void;
}) {
  const { agents, refresh } = useAgentsRoster();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AgentMode>('character');
  const [apiKey, setApiKey] = useState(storedAnthropicKey);
  const [settings, setSettings] = useState<RunSettings>(defaultRunSettings);

  function saveKey(key: string): void {
    setApiKey(key);
    storeAnthropicKey(key);
  }

  async function create(): Promise<void> {
    await createAgent(mode, name.trim());
    setName('');
    refresh();
  }

  async function run(agent: RosterAgent): Promise<void> {
    await startRun(agent.id, {
      goal: settings.goal,
      model: settings.model,
      budgetUsd: settings.budgetUsd,
      apiKey: apiKey.trim() === '' ? null : apiKey.trim(),
    });
    onSelect(agent.id);
    refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <input
          type="password"
          className={FIELD_CLASSES}
          placeholder="Anthropic API key (stored in this browser)"
          value={apiKey}
          onChange={(event) => saveKey(event.target.value)}
        />
        <div className="flex gap-1.5">
          <input
            className={`${FIELD_CLASSES} min-w-0 flex-1`}
            placeholder="name (optional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Select
            fullWidth={false}
            options={[
              { value: 'character', text: 'character' },
              { value: 'god', text: 'god' },
            ]}
            value={mode}
            onChange={(value) => setMode(value as AgentMode)}
          />
          <Button onClick={() => void create()}>+ agent</Button>
        </div>
        <Select
          options={[...MODEL_OPTIONS]}
          value={settings.model}
          onChange={(model) => setSettings({ ...settings, model })}
        />
        <textarea
          className={`${FIELD_CLASSES} h-14 resize-y`}
          placeholder="run goal"
          value={settings.goal}
          onChange={(event) => setSettings({ ...settings, goal: event.target.value })}
        />
        <div className={`${HINT_CLASSES} flex items-center gap-1.5`}>
          <label className="flex items-center gap-1.5">
            budget $
            <input
              type="number"
              min={0.01}
              max={100}
              step={0.25}
              className={`${FIELD_CLASSES} w-16`}
              value={settings.budgetUsd}
              onChange={(event) => setSettings({ ...settings, budgetUsd: Number(event.target.value) })}
            />
          </label>
          <span>at list prices; the run stops when it runs out</span>
        </div>
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={agent.id === selectedId}
            onSelect={() => onSelect(agent.id === selectedId ? null : agent.id)}
            onRun={() => void run(agent)}
            onStop={() => void stopRun(agent.id).then(refresh)}
            onDelete={() =>
              void deleteAgent(agent.id).then(() => {
                if (selectedId === agent.id) onSelect(null);
                refresh();
              })
            }
          />
        ))}
      </div>
      <p className={`${HINT_CLASSES} mt-2`}>
        Agents live on the dev server and play through the same API an external LLM would use:
        <code> GET /api/v1/docs</code>. A run drives the agent with the chosen model on your key;
        without a key you can still drive agents by hand with curl.
      </p>
    </>
  );
}
