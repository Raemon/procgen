import { runLatentInference } from '../src/latents/inferLatents';
import type { LatentReport } from '../src/latents/latentTypes';
import { rankNormalized } from '../src/latents/rankNormalize';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
import type { CheckReporter } from './checkPrefabAndCreatureInvariants';

const CHECK_OPTIONS = { chunkSpan: 4, clusterCount: 5, axisCount: 2, iterations: 12 };

export function checkLatentInvariants(check: CheckReporter): void {
  checkRankNormalization(check);
  const first = inferOnPreset('islands & forests');
  const second = inferOnPreset('islands & forests');
  checkReportShape(check, first);
  checkDeterminism(check, first, second);
  checkNamesAreEnglish(check, first);
}

function inferOnPreset(name: string): LatentReport {
  const preset = examplePipelines().find((pipeline) => pipeline.name === name)!;
  const store = new PipelineStore(sanitizePipeline(preset.state));
  return runLatentInference(store, new PipelineEvaluator(store), CHECK_OPTIONS);
}

function checkRankNormalization(check: CheckReporter): void {
  const constant = rankNormalized(Float32Array.from([3, 3, 3, 3]));
  const mixed = rankNormalized(Float32Array.from([5, 1, 1, 9]));
  check('a constant channel rank-normalizes without inventing variance', constant.every((value) => value === constant[0]));
  check('tied values share one averaged rank', mixed[1] === mixed[2] && mixed[3] === 1 && mixed[1]! < mixed[0]!);
}

function checkReportShape(check: CheckReporter, report: LatentReport): void {
  const shareSum = report.clusters.reduce((sum, cluster) => sum + cluster.share, 0);
  check('latent clusters partition every sampled cell', Math.abs(shareSum - 1) < 1e-6);
  check('latent axes carry variance shares between zero and one', report.axes.every((axis) => axis.varianceShare >= 0 && axis.varianceShare <= 1.0001));
  check('sealed channel labels stay out of cluster names', report.clusters.every((cluster) => report.sealedChannelLabels.every((label) => !cluster.name.includes(label))));
}

function checkDeterminism(check: CheckReporter, first: LatentReport, second: LatentReport): void {
  const sameAssignment = first.assignment.length === second.assignment.length &&
    first.assignment.every((value, i) => value === second.assignment[i]);
  const sameNames = first.clusters.every((cluster, i) => cluster.name === second.clusters[i]?.name);
  check('latent inference is deterministic for a fixed pipeline', sameAssignment && sameNames);
}

function checkNamesAreEnglish(check: CheckReporter, report: LatentReport): void {
  check('every latent cluster gets a nonempty english name', report.clusters.every((cluster) => /^[a-z]/.test(cluster.name) && cluster.name.length > 3));
  check('the islands world is read as basin plus high ground', ['deep basin', 'high ground'].every((role) => report.clusters.some((cluster) => cluster.name.startsWith(role))));
}
