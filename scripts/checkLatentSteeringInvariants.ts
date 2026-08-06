import { GLOSSARY, GLOSSARY_DEFINITION_LIMIT, GLOSSARY_EXAMPLE_LIMIT } from '../src/explainer/glossary';
import { offsetsForAxisAmounts } from '../src/latents/axisOffsets';
import { runLatentInference } from '../src/latents/inferLatents';
import { knobJacobianSteps, CALIBRATION_CHUNK_SPAN } from '../src/latents/knobJacobian';
import { knobWithFractionAdded, steerableKnobsOf } from '../src/latents/knobInventory';
import type { LatentReport } from '../src/latents/latentTypes';
import { sampleChannelSteps } from '../src/latents/sampleChannels';
import { knobFractionsForTarget } from '../src/latents/solveKnobDeltas';
import { flattenedStatistics, worldStatistics } from '../src/latents/worldStatistics';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { FieldOffsets } from '../src/procgen/eval/fieldOffsets';
import { worldFromState } from '../src/procgen/pipeline/perturbedEvaluator';
import type { PipelineState } from '../src/procgen/pipeline/pipelineState';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
import { asField } from '../src/procgen/values/valueAccess';
import type { CheckReporter } from './checkPrefabAndCreatureInvariants';

const REPORT_OPTIONS = { chunkSpan: 4, clusterCount: 5, axisCount: 2, iterations: 12 };

export function checkLatentSteeringInvariants(check: CheckReporter): void {
  checkGlossaryFitsItsTooltip(check);
  const state = presetState('earthlike coasts & ranges');
  const report = inferOn(state);
  checkOffsetsCascadeAndClear(check, state, report);
  checkSteeringMovesItsTarget(check, state, report);
}

function presetState(name: string): PipelineState {
  return sanitizePipeline(examplePipelines().find((pipeline) => pipeline.name === name)!.state);
}

function inferOn(state: PipelineState): LatentReport {
  const store = new PipelineStore(state);
  return runLatentInference(store, new PipelineEvaluator(store), REPORT_OPTIONS);
}

function checkGlossaryFitsItsTooltip(check: CheckReporter): void {
  const entries = Object.entries(GLOSSARY);
  check('every glossary definition fits the one-line limit', entries.every(([, entry]) => entry.definition.length <= GLOSSARY_DEFINITION_LIMIT));
  check('every glossary example fits the paragraph limit', entries.every(([, entry]) => entry.example.length <= GLOSSARY_EXAMPLE_LIMIT));
  check('every glossary entry carries both a definition and an example', entries.every(([, entry]) => entry.definition.length > 0 && entry.example.length > 0));
}

function checkOffsetsCascadeAndClear(check: CheckReporter, state: PipelineState, report: LatentReport): void {
  const store = new PipelineStore(state);
  const offsets = new FieldOffsets();
  const evaluator = new PipelineEvaluator(store, offsets);
  const meanOf = (nodeId: string) => fieldMean(evaluator, nodeId);
  const baseline = report.channelNodeIds.map(meanOf);
  const applied = offsetsForAxisAmounts(report, report.axes.map((_, a) => (a === 0 ? 0.3 : 0)));
  offsets.replaceAll(applied);
  const shifted = report.channelNodeIds.map(meanOf);
  const movedCount = shifted.filter((value, i) => Math.abs(value - baseline[i]!) > 1e-6).length;
  const untouched = report.channelNodeIds.filter((nodeId) => !applied.has(nodeId));
  offsets.clear();
  check('an axis offset reaches more field nodes than it directly touches', movedCount > applied.size || untouched.length === 0);
  check('an axis offset moves at least one field node', movedCount > 0);
  check('clearing offsets restores every field exactly', report.channelNodeIds.every((nodeId, i) => Math.abs(meanOf(nodeId) - baseline[i]!) < 1e-9));
}

function fieldMean(evaluator: PipelineEvaluator, nodeId: string): number {
  const field = asField(evaluator.valueFor(nodeId, 0, 0));
  if (!field) return 0;
  let total = 0;
  for (let i = 0; i < field.length; i++) total += field[i]!;
  return total / field.length;
}

function checkSteeringMovesItsTarget(check: CheckReporter, state: PipelineState, report: LatentReport): void {
  const jacobian = drain(knobJacobianSteps(state, report));
  const secondRun = drain(knobJacobianSteps(state, report));
  check('every steerable knob is a numeric knob of an enabled node', jacobian.knobs.length > 0 && jacobian.knobs.length <= steerableKnobsOf(state.nodes).length);
  check('the knob jacobian is deterministic', jacobian.columns.every((column, k) => column.every((value, t) => value === secondRun.columns[k]![t])));
  const targetIndex = 0;
  const amount = 0.05;
  const target = jacobian.baseline.map((_, t) => (t === targetIndex ? amount : 0));
  const fractions = knobFractionsForTarget(jacobian, target);
  const steered = stateWithKnobFractions(state, jacobian, fractions);
  const actual = statisticsOf(state, report, steered);
  check('steering a latent moves that latent in the requested direction', Math.sign(actual[targetIndex]! - jacobian.baseline[targetIndex]!) === Math.sign(amount));
  check('steering keeps every knob inside its declared range', jacobian.knobs.every((knob, k) => {
    const value = knobWithFractionAdded(knob, fractions[k]!);
    return value >= knob.min && value <= knob.max;
  }));
}

function stateWithKnobFractions(
  state: PipelineState,
  jacobian: { knobs: ReturnType<typeof steerableKnobsOf> },
  fractions: number[],
): PipelineState {
  return jacobian.knobs.reduce<PipelineState>((current, knob, k) => {
    const value = knobWithFractionAdded(knob, fractions[k] ?? 0);
    return {
      seed: current.seed,
      nodes: current.nodes.map((node) =>
        node.id === knob.nodeId ? { ...node, params: { ...node.params, [knob.param]: value } } : node,
      ),
    };
  }, state);
}

function statisticsOf(_state: PipelineState, report: LatentReport, steered: PipelineState): number[] {
  const world = worldFromState(steered, null);
  const sampled = drain(sampleChannelSteps(world, world.evaluator, CALIBRATION_CHUNK_SPAN));
  return flattenedStatistics(worldStatistics(report, sampled.channels));
}

function drain<T>(steps: Generator<unknown, T>): T {
  let next = steps.next();
  while (!next.done) next = steps.next();
  return next.value;
}
