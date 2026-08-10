import '../procgen/nodes';
import { CHUNK_SIZE } from '../procgen/chunk';
import { PRESENT } from '../procgen/time/worldTime';
import type { WorldPoint } from '../procgen/values/chunkValues';
import { BORN, pointNumber } from '../procgen/values/pointData';
import { asPoints } from '../procgen/values/valueAccess';
import type { CheckReporter } from './checkReporter';
import { stateOfNodes, worldFromState } from './pipelineWorldFixtures';

const SPAN_CHUNKS = 5;

export function checkSettlementSpread(check: CheckReporter): void {
  const world = worldFromState(settlementFixture());
  const again = worldFromState(settlementFixture());
  const founded = pointsIn(world, 'founded');

  check('the settlement fixture founds villages to reason about', founded.length > 0);
  check(
    'the same seed founds the same villages with the same founding years',
    JSON.stringify(founded) === JSON.stringify(pointsIn(again, 'founded')),
  );
  check(
    'no village is founded after the present, since the frontier has not reached further',
    founded.every((village) => pointNumber(village, BORN, PRESENT) <= PRESENT),
  );
  check(
    'villages keep the spacing their knob asks for, so none crowds another',
    everyPairAtLeast(founded, 96),
  );
  checkTimeClipsSettlement(check);
  checkCampsFollowTheirVillage(check);
}

function checkTimeClipsSettlement(check: CheckReporter): void {
  const now = worldFromState(settlementFixture());
  const then = worldFromState(withTime(settlementFixture(), -600));
  const standingNow = pointsIn(now, 'villages');
  const standingThen = pointsIn(then, 'villages');
  check(
    'scrubbing world time back leaves a village standing only if it was already founded',
    standingThen.every((village) => pointNumber(village, BORN, PRESENT) <= -600),
  );
  check(
    'every village standing in the past is still standing in the present, so the story only grows',
    standingThen.every((past) => standingNow.some((now) => now.x === past.x && now.y === past.y)),
  );
  check(
    'a village grows outward over time rather than appearing whole',
    housesOf(then).length <= housesOf(now).length,
  );
}

function checkCampsFollowTheirVillage(check: CheckReporter): void {
  const world = worldFromState(settlementFixture());
  const camps = pointsIn(world, 'camps');
  const villages = pointsIn(world, 'founded');
  check(
    'every mining camp is founded after the village whose miners walked out to it',
    camps.every((camp) => oldestVillageNear(camp, villages) < pointNumber(camp, BORN, PRESENT)),
  );
  check(
    'every mining camp stands on a deposit rather than beside one',
    camps.every((camp) => pointsIn(world, 'deposits').some((ore) => ore.x === camp.x && ore.y === camp.y)),
  );
}

function oldestVillageNear(camp: WorldPoint, villages: readonly WorldPoint[]): number {
  const reachable = villages.filter((village) => Math.hypot(village.x - camp.x, village.y - camp.y) <= 176);
  return Math.min(...reachable.map((village) => pointNumber(village, BORN, PRESENT)));
}

function housesOf(world: ReturnType<typeof worldFromState>): WorldPoint[] {
  return pointsIn(world, 'houses');
}

function everyPairAtLeast(points: readonly WorldPoint[], apart: number): boolean {
  return points.every((one, index) =>
    points.slice(index + 1).every((other) => Math.hypot(one.x - other.x, one.y - other.y) >= apart),
  );
}

function pointsIn(world: ReturnType<typeof worldFromState>, nodeId: string): WorldPoint[] {
  const points: WorldPoint[] = [];
  for (let chunkY = -SPAN_CHUNKS; chunkY <= SPAN_CHUNKS; chunkY++) {
    for (let chunkX = -SPAN_CHUNKS; chunkX <= SPAN_CHUNKS; chunkX++) {
      points.push(...(asPoints(world.evaluator.valueFor(nodeId, chunkX, chunkY)) ?? []));
    }
  }
  return points;
}

function withTime(state: ReturnType<typeof settlementFixture>, time: number) {
  return { ...state, time };
}

function settlementFixture() {
  return stateOfNodes([
    { id: 'ground', type: 'noiseField', params: { scale: 0.006, octaves: 4 }, inputs: {} },
    {
      id: 'travel',
      type: 'travelCostField',
      params: { seaLevel: 0.45, seaCost: 18, climbCost: 6 },
      inputs: { elevation: 'ground' },
    },
    {
      id: 'fertility',
      type: 'combineFields',
      params: { operation: 0, weight: 1 },
      inputs: { a: 'ground', b: 'ground' },
    },
    {
      id: 'founded',
      type: 'settlementSpread',
      params: {
        landfallPitch: 512,
        spacing: 96,
        minScore: 0.3,
        spreadSpeed: 0.8,
        qualityHaste: 60,
      },
      inputs: { habitability: 'fertility', travelCost: 'travel' },
    },
    { id: 'villages', type: 'bornFilter', params: {}, inputs: { source: 'founded' } },
    {
      id: 'houses',
      type: 'villagePlots',
      params: { radius: 48, plotCells: 16 },
      inputs: { centers: 'villages' },
    },
    {
      id: 'deposits',
      type: 'scatterPoints',
      params: { density: 0.004, maskAtLeast: 0.5, maskAtMost: 1 },
      inputs: { mask: 'ground' },
    },
    {
      id: 'camps',
      type: 'miningCamps',
      params: { maxHaul: 176, campDelay: 70 },
      inputs: { deposits: 'deposits', villages: 'villages' },
    },
  ]);
}

export const SETTLEMENT_FIXTURE_CHUNK = CHUNK_SIZE;
