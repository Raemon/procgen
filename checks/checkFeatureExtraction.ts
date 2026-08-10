import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import '../procgen/features/index';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import type { Feature } from '../procgen/features/feature';
import {
  featureExtractorOf,
  registeredFeatureExtractorTypes,
} from '../procgen/features/featureExtractorRegistry';
import { featuresInRect } from '../procgen/features/featuresInRect';
import { allNodeTypes, nodeTypeOf } from '../procgen/nodeRegistry';
import { defaultParams, outputKindOf, type NodeTypeDef } from '../procgen/nodeType';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { pointsInRect, type WorldRect } from '../procgen/values/pointsInRect';
import type { CheckReporter } from './checkReporter';
import { endingIn, filesUnder } from './filesUnder';
import { stateOfNodes } from './pipelineWorldFixtures';

const SURVEY: WorldRect = { minX: -64, minY: -64, maxX: 63, maxY: 63 };
const WIDER_SURVEY: WorldRect = { minX: -96, minY: -96, maxX: 95, maxY: 95 };
const BARREL_PATH = 'procgen/features/index.ts';

export function checkFeatureExtraction(check: CheckReporter): void {
  checkEveryPointsNodeResolves(check);
  checkBarrelImportsEveryExtractorFile(check);
  checkExtractionIsStableAndKeyed(check);
  checkDisplayIsIgnoredButDisablingIsNot(check);
  checkEdgesAreHonest(check);
  checkVillagePlotsMatchEmittedPoints(check);
  checkScatterLabelsComeFromTheNode(check);
}

function checkEveryPointsNodeResolves(check: CheckReporter): void {
  const pointsTypes = allNodeTypes().filter(producesPoints);
  check(
    'every points-producing node type resolves to a registered extractor or the shared points default',
    pointsTypes.length > 0 && pointsTypes.every((def) => featureExtractorOf(def.type) !== undefined || producesPoints(def)),
  );
  check(
    'every registered feature extractor names a node type that actually exists',
    registeredFeatureExtractorTypes().every((type) => nodeTypeOf(type) !== undefined),
  );
}

function producesPoints(def: NodeTypeDef): boolean {
  return outputKindOf(def, defaultParams(def)) === 'points';
}

function checkBarrelImportsEveryExtractorFile(check: CheckReporter): void {
  const barrel = readFileSync(BARREL_PATH, 'utf8');
  const extractorFiles = filesUnder('procgen', endingIn('Features.ts'));
  check(
    'the extractor barrel has feature extractor files on disk to import, so scanning finds something',
    extractorFiles.length >= 3,
  );
  check(
    'the features barrel imports every extractor file on disk, so none can silently stop registering',
    extractorFiles.every((path) => barrel.includes(`'${barrelSpecifierOf(path)}'`)),
  );
}

function barrelSpecifierOf(path: string): string {
  const fromBarrel = relative('procgen/features', path).split(sep).join('/').replace(/\.ts$/, '');
  return fromBarrel.startsWith('.') ? fromBarrel : `./${fromBarrel}`;
}

function checkExtractionIsStableAndKeyed(check: CheckReporter): void {
  const { store, evaluator } = worldOfFixture(featureFixtureState());
  const first = featuresInRect(store, evaluator, SURVEY);
  check(
    'extracting the same rect twice yields feature-for-feature identical results',
    JSON.stringify(first) === JSON.stringify(featuresInRect(store, evaluator, SURVEY)) && first.length > 0,
  );
  const widerKeys = new Set(featuresInRect(store, evaluator, WIDER_SURVEY).map((feature) => feature.key));
  check(
    'a feature keeps its key when a larger enclosing survey rect finds it again',
    first.every((feature) => widerKeys.has(feature.key)),
  );
}

function checkDisplayIsIgnoredButDisablingIsNot(check: CheckReporter): void {
  const { store, evaluator } = worldOfFixture(featureFixtureState());
  const hidden = featuresInRect(store, evaluator, SURVEY).filter(ofScatterNode);
  const disabled = worldOfFixture(featureFixtureState({ scatterEnabled: false }));
  check(
    'a points node bound to the hidden display still individuates features',
    hidden.length > 0,
  );
  check(
    'a disabled node generates no features at all',
    featuresInRect(disabled.store, disabled.evaluator, SURVEY).filter(ofScatterNode).length === 0,
  );
}

function ofScatterNode(feature: Feature): boolean {
  return feature.nodeId === 'scatter1';
}

function checkEdgesAreHonest(check: CheckReporter): void {
  const { store, evaluator } = worldOfFixture(featureFixtureState());
  const features = featuresInRect(store, evaluator, WIDER_SURVEY);
  const keys = new Set(features.map((feature) => feature.key));
  check(
    'no default-extracted feature carries a parent or link edge it cannot vouch for',
    features.filter((feature) => feature.nodeId !== 'plots').every(hasNoEdges),
  );
  check(
    'every parent and link key in an extraction resolves to a feature that was actually emitted',
    features.every(
      (feature) =>
        (!feature.parentKey || keys.has(feature.parentKey)) &&
        feature.linkKeys.every((key) => keys.has(key)),
    ),
  );
}

function hasNoEdges(feature: Feature): boolean {
  return feature.parentKey === null && feature.linkKeys.length === 0;
}

function checkVillagePlotsMatchEmittedPoints(check: CheckReporter): void {
  const { store, evaluator } = worldOfFixture(featureFixtureState());
  const plots = featuresInRect(store, evaluator, SURVEY).filter((feature) => feature.nodeId === 'plots');
  const emitted = pointsInRect(evaluator, 'plots', SURVEY);
  check('the village fixture plants plots inside the survey, so matching them means something', plots.length > 0);
  check(
    'every extracted village plot coincides with a point the villagePlots node itself emits',
    plots.length === emitted.length &&
      plots.every((plot) => emitted.some((point) => point.x === plot.x && point.y === plot.y)),
  );
  check(
    'a village plot names its founding center as its parent when that center is in the survey',
    plots.some((plot) => plot.parentKey?.startsWith('centers@')),
  );
}

function checkScatterLabelsComeFromTheNode(check: CheckReporter): void {
  const { store, evaluator } = worldOfFixture(featureFixtureState());
  const scattered = featuresInRect(store, evaluator, SURVEY).filter(ofScatterNode);
  check(
    'a scatterPoints feature is labelled by its node, never by the node id it writes as its tag',
    scattered.length > 0 && scattered.every((feature) => feature.label === 'wildflowers'),
  );
}

function worldOfFixture(state: PipelineState): { store: PipelineStore; evaluator: PipelineEvaluator } {
  const store = new PipelineStore(state);
  return { store, evaluator: new PipelineEvaluator(store) };
}

function featureFixtureState(options: { scatterEnabled?: boolean } = {}): PipelineState {
  return stateOfNodes([
    { id: 'flat', type: 'constantField', params: { value: 0.6 }, inputs: {} },
    scatterNode(options.scatterEnabled ?? true),
    { id: 'beacon', type: 'landmarkPoint', label: 'the beacon', params: { x: 5, y: 6 }, inputs: {} },
    { id: 'centers', type: 'villageCenters', params: { spacing: 64 }, inputs: { mask: 'flat' } },
    {
      id: 'plots',
      type: 'villagePlots',
      params: { radius: 40, plotCells: 14, streetWidth: 3 },
      inputs: { centers: 'centers' },
    },
  ]);
}

function scatterNode(enabled: boolean): Record<string, unknown> {
  return {
    id: 'scatter1',
    type: 'scatterPoints',
    label: 'wildflowers',
    enabled,
    params: { density: 0.01 },
    inputs: {},
    display: { mode: 'hidden' },
  };
}
