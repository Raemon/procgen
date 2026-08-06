import { useEffect, useRef, useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { DEFAULT_LATENT_OPTIONS, inferLatentSteps } from '../../latents/inferLatents';
import type { InferenceProgress, LatentReport } from '../../latents/latentTypes';

export type LatentInferenceState =
  | { status: 'idle' }
  | { status: 'running'; progress: InferenceProgress }
  | { status: 'done'; report: LatentReport; stale: boolean };

export interface LatentInference {
  state: LatentInferenceState;
  run(): void;
}

export function useLatentInference(): LatentInference {
  const { store, evaluator } = useAppRuntime();
  const [state, setState] = useState<LatentInferenceState>({ status: 'idle' });
  const runToken = useRef(0);
  useEffect(
    () =>
      store.onChange(() => {
        runToken.current++;
        setState((held) => (held.status === 'done' ? { ...held, stale: true } : { status: 'idle' }));
      }),
    [store],
  );
  const run = () => {
    const token = ++runToken.current;
    const steps = inferLatentSteps(store, evaluator, DEFAULT_LATENT_OPTIONS);
    const pump = () => {
      if (token !== runToken.current) return;
      const next = steps.next();
      if (next.done) {
        setState({ status: 'done', report: next.value, stale: false });
        return;
      }
      setState({ status: 'running', progress: next.value });
      setTimeout(pump, 0);
    };
    pump();
  };
  return { state, run };
}
