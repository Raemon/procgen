import { worldFromState } from '../procgen/pipeline/perturbedEvaluator';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { sampleChannelSteps } from './sampleChannels';
import type { InferenceProgress, LatentReport } from './latentTypes';
import { knobRange, knobWithFractionAdded, steerableKnobsOf, type SteerableKnob } from './knobInventory';
import { flattenedStatistics, worldStatistics } from './worldStatistics';

export const CALIBRATION_CHUNK_SPAN = 2;
const NUDGE_FRACTION = 0.12;

export interface KnobJacobian {
  knobs: SteerableKnob[];
  columns: number[][];
  baseline: number[];
}

export function* knobJacobianSteps(
  state: PipelineState,
  report: LatentReport,
): Generator<InferenceProgress, KnobJacobian> {
  const knobs = steerableKnobsOf(state.nodes).filter((knob) => knobRange(knob) > 0);
  const baseline = yield* statisticsOfWorld(state, report, null);
  const columns: number[][] = [];
  for (let i = 0; i < knobs.length; i++) {
    columns.push(yield* jacobianColumnSteps(state, report, knobs[i]!, baseline, i, knobs.length));
  }
  return { knobs, columns, baseline };
}

function* jacobianColumnSteps(
  state: PipelineState,
  report: LatentReport,
  knob: SteerableKnob,
  baseline: number[],
  index: number,
  total: number,
): Generator<InferenceProgress, number[]> {
  const nudged = knobWithFractionAdded(knob, NUDGE_FRACTION);
  const appliedFraction = (nudged - knob.value) / knobRange(knob);
  const statistics = yield* statisticsOfWorld(state, report, { knob, value: nudged });
  yield { phase: 'calibrating', done: index + 1, total };
  if (appliedFraction === 0) return baseline.map(() => 0);
  return statistics.map((value, t) => (value - baseline[t]!) / appliedFraction);
}

function* statisticsOfWorld(
  state: PipelineState,
  report: LatentReport,
  override: { knob: SteerableKnob; value: number } | null,
): Generator<InferenceProgress, number[]> {
  const world = worldFromState(
    state,
    override && { nodeId: override.knob.nodeId, param: override.knob.param, value: override.value },
  );
  const sampled = yield* sampleChannelSteps(world, world.evaluator, CALIBRATION_CHUNK_SPAN);
  return flattenedStatistics(worldStatistics(report, sampled.channels));
}
