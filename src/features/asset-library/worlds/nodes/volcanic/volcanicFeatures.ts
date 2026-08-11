import {
  featureKey,
  RANK_DETAIL,
  RANK_LANDMARK,
  RANK_NOTABLE,
  type ExtractedFeature,
} from '../../features/feature';
import {
  registerFeatureExtractor,
  type FeatureExtractionRequest,
} from '../../features/featureExtractorRegistry';
import type { WorldPoint } from '../../values/chunkValues';
import {
  BORN,
  DEPOSIT_KIND,
  HOST_X,
  HOST_Y,
  RICHNESS,
  SENT_FROM_X,
  SENT_FROM_Y,
  hasPointNumber,
  pointNumber,
} from '../../values/pointData';
import { pointsInRect } from '../../values/pointsInRect';

const ERUPTION_PERIOD = 500_000;
const DEPOSIT_NAMES = ['ore', 'obsidian', 'sulfur'];

registerFeatureExtractor('hotspotChain', volcanoFeatures);
registerFeatureExtractor('mineralDeposits', depositFeatures);
registerFeatureExtractor('miningCamps', campFeatures);
registerFeatureExtractor('settlementSpread', villageFeatures);

function volcanoFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  return pointsInRect(request.evaluator, request.node.id, request.rect).map((cone) =>
    volcanoFeature(cone, request.time),
  );
}

function volcanoFeature(cone: WorldPoint, time: number): ExtractedFeature {
  const age = time - pointNumber(cone, BORN, time);
  const young = age < ERUPTION_PERIOD;
  return {
    x: cone.x,
    y: cone.y,
    extent: null,
    label: young ? 'young volcano' : eldedVolcanoLabel(age),
    rank: young ? RANK_LANDMARK : RANK_NOTABLE,
    parentKey: null,
    linkKeys: [],
  };
}

function eldedVolcanoLabel(age: number): string {
  return age > 3_000_000 ? 'drowning volcano' : 'eroded volcano';
}

function depositFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  const volcanoesId = request.node.inputs.volcanoes ?? null;
  return pointsInRect(request.evaluator, request.node.id, request.rect).map((deposit) => ({
    x: deposit.x,
    y: deposit.y,
    extent: null,
    label: depositLabel(deposit),
    rank: RANK_DETAIL,
    parentKey: hostKeyOf(deposit, volcanoesId),
    linkKeys: [],
  }));
}

function depositLabel(deposit: WorldPoint): string {
  const kind = DEPOSIT_NAMES[Math.round(pointNumber(deposit, DEPOSIT_KIND, 0))] ?? 'ore';
  return pointNumber(deposit, RICHNESS, 0) > 0.6 ? `rich ${kind}` : kind;
}

function hostKeyOf(deposit: WorldPoint, volcanoesId: string | null): string | null {
  if (!volcanoesId || !hasPointNumber(deposit, HOST_X)) return null;
  return featureKey(volcanoesId, pointNumber(deposit, HOST_X, 0), pointNumber(deposit, HOST_Y, 0));
}

function campFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  const depositsId = request.node.inputs.deposits ?? null;
  const villagesId = request.node.inputs.villages ?? null;
  return pointsInRect(request.evaluator, request.node.id, request.rect).map((camp) => ({
    x: camp.x,
    y: camp.y,
    extent: null,
    label: 'mining camp',
    rank: RANK_NOTABLE,
    parentKey: sendingVillageKeyOf(camp, villagesId),
    linkKeys: depositsId ? [featureKey(depositsId, camp.x, camp.y)] : [],
  }));
}

function sendingVillageKeyOf(camp: WorldPoint, villagesId: string | null): string | null {
  if (!villagesId || !hasPointNumber(camp, SENT_FROM_X)) return null;
  return featureKey(villagesId, pointNumber(camp, SENT_FROM_X, 0), pointNumber(camp, SENT_FROM_Y, 0));
}

function villageFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  return pointsInRect(request.evaluator, request.node.id, request.rect).map((village) => ({
    x: village.x,
    y: village.y,
    extent: null,
    label: villageLabel(request.time - pointNumber(village, BORN, request.time)),
    rank: RANK_LANDMARK,
    parentKey: null,
    linkKeys: [],
  }));
}

function villageLabel(age: number): string {
  if (age > 500) return 'old town';
  if (age > 200) return 'town';
  return 'frontier hamlet';
}
