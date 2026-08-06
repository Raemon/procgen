import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { knobWithFractionAdded } from '../../latents/knobInventory';
import { knobJacobianSteps, type KnobJacobian } from '../../latents/knobJacobian';
import type { InferenceProgress, LatentReport } from '../../latents/latentTypes';
import { knobFractionsForTarget } from '../../latents/solveKnobDeltas';

export type SteeringState =
  | { status: 'idle' }
  | { status: 'calibrating'; progress: InferenceProgress }
  | { status: 'ready'; jacobian: KnobJacobian };

export interface KnobSteering {
  state: SteeringState;
  calibrate(report: LatentReport): void;
  steer(jacobian: KnobJacobian, targetIndex: number, amount: number): number;
}

export function useKnobSteering(): KnobSteering {
  const { store, perform } = useAppRuntime();
  const [state, setState] = useState<SteeringState>({ status: 'idle' });

  const calibrate = (report: LatentReport) => {
    const steps = knobJacobianSteps({ seed: store.seed(), nodes: [...store.nodes()] }, report);
    const pump = () => {
      const next = steps.next();
      if (next.done) return setState({ status: 'ready', jacobian: next.value });
      setState({ status: 'calibrating', progress: next.value });
      setTimeout(pump, 0);
    };
    pump();
  };

  const steer = (jacobian: KnobJacobian, targetIndex: number, amount: number) => {
    const target = jacobian.baseline.map((_, t) => (t === targetIndex ? amount : 0));
    const fractions = knobFractionsForTarget(jacobian, target);
    return applyKnobFractions(jacobian, fractions, perform);
  };

  return { state, calibrate, steer };
}

type Perform = (action: string, params?: Record<string, unknown>) => unknown;

function applyKnobFractions(jacobian: KnobJacobian, fractions: number[], perform: Perform): number {
  let turned = 0;
  jacobian.knobs.forEach((knob, k) => {
    const value = knobWithFractionAdded(knob, fractions[k] ?? 0);
    if (value === knob.value) return;
    perform('set_param', { node_id: knob.nodeId, param: knob.param, value });
    turned++;
  });
  return turned;
}
