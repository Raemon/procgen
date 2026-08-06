import { useState } from 'react';
import { EARSHOT_RADIUS } from '../../abilities/speakAbilities';
import type { AppRuntime } from '../../app/appRuntime';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnPlayerMove, useRerenderOnWorldChange } from '../../app/rerenderHooks';

const ANSWERS_KEPT = 3;
const NAMES_SHOWN = 4;

export function SpeakBar() {
  const runtime = useAppRuntime();
  useRerenderOnPlayerMove();
  useRerenderOnWorldChange();
  const [utterance, setUtterance] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const speak = () => {
    if (utterance.trim() === '') return;
    setAnswers((held) => [...held, answerTo(runtime, utterance)].slice(-ANSWERS_KEPT));
    setUtterance('');
  };
  return (
    <div className="border-t border-panel-edge bg-panel px-3 py-2 text-xs">
      <p className="text-ink-dim">{overheardLine(runtime)}</p>
      {answers.map((line, index) => (
        <p key={index} className="text-ink">
          {line}
        </p>
      ))}
      <input
        value={utterance}
        onChange={(event) => setUtterance(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && speak()}
        placeholder="speak a word aloud…"
        className="mt-1 w-full rounded border border-panel-edge bg-transparent px-2 py-1 text-ink outline-none"
      />
    </div>
  );
}

function answerTo(runtime: AppRuntime, utterance: string): string {
  const result = runtime.perform('speak', { utterance });
  return result.ok ? result.summary : result.hint;
}

function overheardLine(runtime: AppRuntime): string {
  const names = namesInEarshot(runtime);
  return names.length > 0 ? `you hear the names: ${names.join(' · ')}` : 'no names reach you here';
}

function namesInEarshot(runtime: AppRuntime): string[] {
  const { playerX, playerY } = runtime.world;
  const markers = runtime.sampler.markersIn(
    playerX - EARSHOT_RADIUS,
    playerY - EARSHOT_RADIUS,
    playerX + EARSHOT_RADIUS,
    playerY + EARSHOT_RADIUS,
  );
  const names = markers.map((marker) => marker.tag).filter((tag) => tag !== 'vault');
  return [...new Set(names)].slice(0, NAMES_SHOWN);
}
