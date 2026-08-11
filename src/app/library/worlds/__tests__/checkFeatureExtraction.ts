import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import '../procgen/features/index';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import type { Feature } from '../procgen/features/feature';
import {
  registeredFeatureExtractorTypes,
} from '../procgen/features/featureExtractorRegistry';
import {
  featuresBeforeEdgesAreScrubbed,
  featuresInRect,
} from '../procgen/features/featuresInRect';
import { LABYRINTH_CELL_SIZE } from '../procgen/labyrinth/labyrinthLattice';
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
const ONE_CHUNK: WorldRect = { minX: 0, minY: 0, maxX: 31, maxY: 31 };
const BARREL_PATH = 'procgen/features/index.ts';

export function checkFeatureExtraction(check: CheckReporter): void {
  checkEveryPointsNodeResolves(check);
  checkBarrelImportsEveryExtractorFile(check);
  checkExtractionIsStableAndKeyed(check);
  checkDisplayIsIgnoredButDisablingIsNot(check);
  checkEdgesAreHonest(check);
  checkVillagePlotsMatchEmittedPoints(check);
  checkScatterLabelsComeFromTheNode(check);
  checkVolcanicProvenanceIsCarried(check);
  checkChamberLinksFollowOpenExits(check);
}

function checkVolcanicProvenanceIsCarried(check: CheckReporter): void {
  const { store, evaluator } = worldOfFixture(volcanicFixtureState());
  const features = featuresInRect(store, evaluator, SURVEY);
  const keys = new Set(features.map((feature) => feature.key));
  const deposits = features.filter((feature) => feature.nodeId === 'ore');
  const camps = features.filter((feature) => feature.nodeId === 'camps');
  check('the volcanic fixture yields deposits and camps to trace', deposits.length > 0 && camps.length > 0);
  check(
    'deposits name the volcano they formed on, and never name one the survey did not find',
    deposits.some((ore) => ore.parentKey !== null) &&
      deposits.every((ore) => ore.parentKey === null || keys.has(ore.parentKey)),
  );
  check(
    'every mining camp stands on a deposit, and the camps that name a sending village name a real one',
    camps.every((camp) => camp.linkKeys.length === 1 && (camp.parentKey === null || keys.has(camp.parentKey))),
  );
}

function checkChamberLinksFollowOpenExits(check: CheckReporter): void {
  const { store, evaluator } = worldOfFixture(labyrinthFixtureState());
  const chambers = featuresInRect(store, evaluator, SURVEY);
  const keys = new Set(chambers.map((feature) => feature.key));
  check('the labyrinth fixture yields chambers to trace', chambers.length > 0);
  check(
    'a chamber links only to chunks that are chambers themselves, so no corridor leads nowhere',
    chambers.every((chamber) => chamber.linkKeys.every((key) => keys.has(key))),
  );
  check(
    'every chamber carries the extent of the labyrinth cell it fills, so the map draws rooms not dots',
    chambers.every(
      (chamber) =>
        chamber.extent?.width === LABYRINTH_CELL_SIZE &&
        chamber.extent.height === LABYRINTH_CELL_SIZE,
    ),
  );
  check(
    'corridor links are mutual, since a seam either side agrees is the same seam',
    chambers.every((chamber) => chamber.linkKeys.every((key) => linksBack(chambers, key, chamber.key))),
  );
}

function linksBack(chambers: readonly Feature[], key: string, backTo: string): boolean {
  const neighbour = chambers.find((chamber) => chamber.key === key);
  return neighbour === undefined || neighbour.linkKeys.includes(backTo);
}

function volcanicFixtureState(): PipelineState {
  return stateOfNodes([
    { id: 'cones', type: 'hotspotChain', params: { hotspotSpacing: 256, chainFraction: 1 }, inputs: {} },
    { id: 'shape', type: 'volcanoConeField', params: {}, inputs: { volcanoes: 'cones' } },
    {
      id: 'ore',
      type: 'mineralDeposits',
      params: { density: 0.05, minIslandAge: 0 },
      inputs: { volcanoes: 'cones', elevation: 'shape' },
    },
    { id: 'travel', type: 'travelCostField', params: {}, inputs: { elevation: 'shape' } },
    {
      id: 'towns',
      type: 'settlementSpread',
      params: { landfallPitch: 512, spacing: 64, minScore: 0, spreadSpeed: 3 },
      inputs: { habitability: 'shape', travelCost: 'travel' },
    },
    {
      id: 'camps',
      type: 'miningCamps',
      params: { maxHaul: 400, campDelay: 20 },
      inputs: { deposits: 'ore', villages: 'towns' },
    },
  ]);
}

function labyrinthFixtureState(): PipelineState {
  return stateOfNodes([
    { id: 'delve', type: 'labyrinthChunks', params: { roomFraction: 0.75, tutorialRings: 3 }, inputs: {} },
  ]);
}

function checkEveryPointsNodeResolves(check: CheckReporter): void {
  const pointsTypes = allNodeTypes().filter(producesPoints);
  check(
    'every points-producing node type survives being surveyed on its own, so no node can crash the map',
    pointsTypes.length > 0 && pointsTypes.every(surveysWithoutThrowing),
  );
  check(
    'every registered feature extractor names a node type that actually exists',
    registeredFeatureExtractorTypes().every((type) => nodeTypeOf(type) !== undefined),
  );
}

function surveysWithoutThrowing(def: NodeTypeDef): boolean {
  const state = stateOfNodes([{ id: 'lone', type: def.type, params: defaultParams(def), inputs: {} }]);
  const { store, evaluator } = worldOfFixture(state);
  return Array.isArray(featuresInRect(store, evaluator, ONE_CHUNK));
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
  const { store, evaluator } = theFeatureFixture();
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
  const { store, evaluator } = theFeatureFixture();
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
  const { store, evaluator } = theFeatureFixture();
  const features = featuresInRect(store, evaluator, WIDER_SURVEY);
  const keys = new Set(featuresInRect(store, evaluator, SURVEY).map((feature) => feature.key));
  check(
    'no default-extracted feature carries a parent or link edge it cannot vouch for',
    features.filter((feature) => feature.nodeId !== 'plots').every(hasNoEdges),
  );
  const raw = featuresBeforeEdgesAreScrubbed(store, evaluator, SURVEY);
  const wider = new Set(features.map((feature) => feature.key));
  check(
    'the narrow survey names edges that reach outside it, so dropping them is a real decision',
    raw.some((feature) => edgeKeysOf(feature).some((key) => !keys.has(key))) && raw.length > 0,
  );
  check(
    'every edge a survey names is a feature some survey can find, never a key nothing answers to',
    raw.every((feature) => edgeKeysOf(feature).every((key) => wider.has(key))),
  );
}

function edgeKeysOf(feature: Feature): string[] {
  return feature.parentKey ? [feature.parentKey, ...feature.linkKeys] : [...feature.linkKeys];
}

function hasNoEdges(feature: Feature): boolean {
  return feature.parentKey === null && feature.linkKeys.length === 0;
}

function checkVillagePlotsMatchEmittedPoints(check: CheckReporter): void {
  const { store, evaluator } = theFeatureFixture();
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
  const { store, evaluator } = theFeatureFixture();
  const scattered = featuresInRect(store, evaluator, SURVEY).filter(ofScatterNode);
  check(
    'a scatterPoints feature is labelled by its node, never by the node id it writes as its tag',
    scattered.length > 0 && scattered.every((feature) => feature.label === 'wildflowers'),
  );
}

type FixtureWorld = { store: PipelineStore; evaluator: PipelineEvaluator };

let sharedFixture: FixtureWorld | null = null;

function theFeatureFixture(): FixtureWorld {
  if (!sharedFixture) sharedFixture = worldOfFixture(featureFixtureState());
  return sharedFixture;
}

function worldOfFixture(state: PipelineState): FixtureWorld {
  const store = new PipelineStore(state);
  return { store, evaluator: new PipelineEvaluator(store) };
}

function featureFixtureState(options: { scatterEnabled?: boolean } = {}): PipelineState {
  return stateOfNodes([
    { id: 'flat', type: 'constantField', params: { value: 0.6 }, inputs: {} },
    scatterNode(options.scatterEnabled ?? true),
    { id: 'beacon', type: 'landmarkPoint', label: 'the beacon', params: { x: 5, y: 6 }, inputs: {} },
    { id: 'travel', type: 'travelCostField', params: { seaLevel: 0.2 }, inputs: { elevation: 'flat' } },
    {
      id: 'centers',
      type: 'settlementSpread',
      params: { landfallPitch: 512, spacing: 64, minScore: 0, spreadSpeed: 3 },
      inputs: { habitability: 'flat', travelCost: 'travel' },
    },
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
