import { useState } from 'react';
import { Button } from '@/features/app-shell/controls/Button';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { characterNamed } from '@/features/game/multiplayer/client/charactersInPlay';
import { Select } from '@/features/app-shell/controls/Select';
import { DIM_READOUT_CLASSES, FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import type { AgentMode } from '../agentMode';
import { createAgent, deleteAgent, startRun, stopRun, type RosterAgent } from './agentsApiClient';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import {
  AGENT_MODE_TIP,
  AGENT_NAME_TIP,
  API_KEY_TIP,
  BUDGET_TIP,
  CREATE_AGENT_TIP,
  GOAL_TIP,
  MODEL_TIP,
} from './help/agentTips';
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
  const runtime = useAppRuntime();
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

  function selectAndWatch(agent: RosterAgent): void {
    const alreadySelected = agent.id === selectedId;
    onSelect(alreadySelected ? null : agent.id);
    if (alreadySelected) return runtime.cameraFocus.clear();
    const inPlay = characterNamed(runtime.world, runtime.net.remotePlayers, agent.name);
    if (inPlay) runtime.cameraFocus.follow(inPlay.id);
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
          {...tooltipHandlers(API_KEY_TIP)}
        />
        <div className="flex gap-1.5">
          <input
            className={`${FIELD_CLASSES} min-w-0 flex-1`}
            placeholder="name (optional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            {...tooltipHandlers(AGENT_NAME_TIP)}
          />
          <Select
            fullWidth={false}
            options={[
              { value: 'character', text: 'character' },
              { value: 'god', text: 'god' },
            ]}
            value={mode}
            tip={AGENT_MODE_TIP}
            onChange={(value) => setMode(value as AgentMode)}
          />
          <Button tip={CREATE_AGENT_TIP} onClick={() => void create()}>
            + agent
          </Button>
        </div>
        <Select
          options={[...MODEL_OPTIONS]}
          value={settings.model}
          tip={MODEL_TIP}
          onChange={(model) => setSettings({ ...settings, model })}
        />
        <textarea
          className={`${FIELD_CLASSES} h-14 resize-y`}
          placeholder="run goal"
          value={settings.goal}
          onChange={(event) => setSettings({ ...settings, goal: event.target.value })}
          {...tooltipHandlers(GOAL_TIP)}
        />
        <div className={`${DIM_READOUT_CLASSES} flex items-center gap-1.5`}>
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
              {...tooltipHandlers(BUDGET_TIP)}
            />
          </label>
          <PanelHint>at list prices; the run stops when it runs out</PanelHint>
        </div>
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={agent.id === selectedId}
            onSelect={() => selectAndWatch(agent)}
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
      <PanelHint className="mt-2">
        Agents live on the dev server and play through the same API an external LLM would use:
        <code> GET /api/v1/openapi.json</code>. A run drives the agent with the chosen model on your key;
        without a key you can still drive agents by hand with curl.
      </PanelHint>
    </>
  );
}
