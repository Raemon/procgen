import '../nodes';
import { CHUNK_SIZE } from '../chunk';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { PROFILE_BELL, PROFILE_RAMP } from '../shape/fieldProfile';
import { PROFILE_RIM, stampValueAt } from '../shape/pointStamp';
import { CONE_GROWTH_SPAN } from '../volcanic/hotspotChains';
import { agedCone, agedConeHeightAt, coneOfPoint } from '../volcanic/coneProfile';
import { ashFalloff } from '../volcanic/soilMaturity';
import type { WorldPoint } from '../values/chunkValues';
import {
  ANCHOR_X,
  ANCHOR_Y,
  ANGLE,
  BORN,
  CONE_HEIGHT,
  CONE_RADIUS,
  SENT_FROM_X,
  SENT_FROM_Y,
  STAMP_RADIUS,
  STAMP_WEIGHT,
} from '../values/pointData';
import { asPoints } from '../values/valueAccess';
import { fieldAt, fieldBytes, stateOfNodes, worldFromState } from './pipelineWorldFixtures';

const SEA_LEVEL = 0.45;
const SEAFLOOR_BASE = SEA_LEVEL * 0.55;
const HALF_LIFE = 2_500_000;
const GATHER = 96;

const CHAIN_SPEC = {
  hotspotSpacing: 256,
  driftRate: 0.0001,
  eruptionPeriod: 500_000,
  coneRadius: 40,
  coneHeight: 1,
  chainFraction: 0.4,
};

export function checkPointKernels(check: CheckReporter): void {
  checkTheStampMakesAConeField(check);
  checkTheStampMakesAnAshfallSum(check);
  checkTheStampMakesSinkholesAndBars(check);
  checkTheAttributeFieldMakesIslandBirthYears(check);
  checkACraterArrivesAsAProfileShape(check);
  checkScatterCarriesWhatAStampNeeds(check);
  checkAttachingToTheNearestFoundsTheSameCamps(check);
}

function coneFieldStates() {
  const volcanoes = { id: 'volcanoes', type: 'hotspotChain', params: CHAIN_SPEC, inputs: {} };
  const reference = stateOfNodes([
    volcanoes,
    {
      id: 'cones',
      type: 'volcanoConeField',
      params: { seaLevel: SEA_LEVEL, erosionHalfLife: HALF_LIFE, craterDepth: 0, shoulder: 0 },
      inputs: { volcanoes: 'volcanoes' },
    },
  ]);
  const built = stateOfNodes([
    volcanoes,
    { id: 'living', type: 'bornFilter', params: {}, inputs: { source: 'volcanoes' } },
    {
      id: 'worn',
      type: 'mapPointAttribute',
      params: { key: CONE_HEIGHT, curve: 1, rate: 0.5, perYears: HALF_LIFE },
      inputs: { source: 'living' },
    },
    {
      id: 'stamped',
      type: 'stampPointsField',
      params: {
        profile: PROFILE_RIM,
        rimDepth: 0,
        radiusFrom: 1,
        radiusKey: CONE_RADIUS,
        weightFrom: 1,
        weightKey: CONE_HEIGHT,
        combine: 0,
        aspect: 1,
        maxRadius: GATHER,
      },
      inputs: { points: 'worn' },
    },
  ]);
  return { reference, built };
}

function checkTheStampMakesAConeField(check: CheckReporter): void {
  const { reference, built } = coneFieldStates();
  const referenceWorld = worldFromState(reference);
  const builtWorld = worldFromState(built);
  for (const world of [referenceWorld, builtWorld]) world.store.setTime(-1_000_000);
  const chunks: Array<[number, number]> = [[0, 0], [1, 0], [-2, 3]];
  const same = chunks.every(([cx, cy]) => {
    const wanted = JSON.parse(fieldBytes(referenceWorld.evaluator, 'cones', cx, cy)) as number[];
    const got = JSON.parse(fieldBytes(builtWorld.evaluator, 'stamped', cx, cy)) as number[];
    return got.every((value, at) => Math.fround(Math.max(SEAFLOOR_BASE, value)) === wanted[at]);
  });
  const anyCones = chunks.some(([cx, cy]) =>
    (JSON.parse(fieldBytes(referenceWorld.evaluator, 'cones', cx, cy)) as number[]).some(
      (value) => value > SEAFLOOR_BASE,
    ),
  );
  check('the fixture really does raise cones, so a matching field is not two flat seafloors', anyCones);
  check(
    'a rim stamp over aged points rebuilds the volcano cone field cell for cell, once the seafloor it sits on is maxed back in',
    same,
  );
}

function checkTheStampMakesAnAshfallSum(check: CheckReporter): void {
  const ashRadius = 40;
  const world = worldFromState(
    stateOfNodes([
      { id: 'volcanoes', type: 'hotspotChain', params: CHAIN_SPEC, inputs: {} },
      { id: 'living', type: 'bornFilter', params: {}, inputs: { source: 'volcanoes' } },
      {
        id: 'ash',
        type: 'stampPointsField',
        params: {
          profile: PROFILE_RAMP,
          radiusFrom: 0,
          radius: ashRadius,
          weightFrom: 1,
          weightKey: CONE_HEIGHT,
          combine: 1,
          aspect: 1,
          maxRadius: ashRadius,
        },
        inputs: { points: 'living' },
      },
    ]),
  );
  world.store.setTime(-1_000_000);
  const cones = pointsWithin(world, 'living', 3).map(coneOfPoint);
  const drifts = sampleCells().map((cell) => {
    const wanted = cones.reduce(
      (sum, cone) =>
        sum + ashFalloff(Math.hypot(cell.x - cone.x, cell.y - cone.y), ashRadius) * cone.height,
      0,
    );
    return Math.abs(fieldAt(world.evaluator, 'ash', cell.x, cell.y) - Math.fround(wanted));
  });
  check('the ashfall fixture really does drop ash on the cells it checks', cones.length > 0);
  check(
    'a summed ramp stamp is the linear ashfall volcanic fertility spreads, to within the last bit of a float',
    drifts.every((drift) => drift < 1e-6),
  );
}

function checkTheStampMakesSinkholesAndBars(check: CheckReporter): void {
  const bell = { shape: PROFILE_BELL, levels: 4, bands: 3, rimDepth: 0 };
  check(
    'a bell stamp is worth its whole weight at the point and nothing at the rim, so subtracting it downstream digs a sinkhole',
    stampValueAt(0, 20, 0.4, bell) === 0.4 &&
      stampValueAt(20, 20, 0.4, bell) === 0 &&
      stampValueAt(10, 20, 0.4, bell) < 0.4 &&
      stampValueAt(10, 20, 0.4, bell) > 0,
  );
  const bar = barWorld();
  const along = fieldAt(bar.evaluator, 'bar', 60, 16);
  const across = fieldAt(bar.evaluator, 'bar', 16, 60);
  check(
    'with an aspect of 4 a stamp reaches four times as far along its angle as across it, turning a disc into a bar',
    fieldAt(bar.evaluator, 'bar', 16, 16) > 0 && along > 0 && across === 0,
  );
  check(
    'the bar still ends: past four radii along its angle there is nothing',
    fieldAt(bar.evaluator, 'bar', 90, 16) === 0,
  );
}

function barWorld() {
  return worldFromState(
    stateOfNodes([
      {
        id: 'seeds',
        type: 'customScript',
        params: {
          outputKind: 'points',
          code: `return ctx.chunkX === 0 && ctx.chunkY === 0
            ? [{ x: 16, y: 16, tag: 'bar', data: { ${JSON.stringify(ANGLE)}: 0 } }]
            : [];`,
        },
        inputs: {},
      },
      {
        id: 'bar',
        type: 'stampPointsField',
        params: {
          profile: PROFILE_BELL,
          radiusFrom: 0,
          radius: 18,
          weightFrom: 0,
          weight: 1,
          combine: 0,
          orientFrom: ANGLE,
          aspect: 4,
          maxRadius: 96,
        },
        inputs: { points: 'seeds' },
      },
    ]),
  );
}

function checkTheAttributeFieldMakesIslandBirthYears(check: CheckReporter): void {
  const volcanoes = { id: 'volcanoes', type: 'hotspotChain', params: CHAIN_SPEC, inputs: {} };
  const reference = worldFromState(
    stateOfNodes([
      volcanoes,
      { id: 'birth', type: 'islandBirthField', params: { seaLevel: SEA_LEVEL }, inputs: { volcanoes: 'volcanoes' } },
    ]),
  );
  const built = worldFromState(
    stateOfNodes([
      volcanoes,
      {
        id: 'birth',
        type: 'pointAttributeField',
        params: {
          attrKey: BORN,
          reduce: 0,
          missing: 0,
          within: 1,
          threshold: SEA_LEVEL,
          profile: PROFILE_RIM,
          radiusFrom: 1,
          radiusKey: CONE_RADIUS,
          weightFrom: 1,
          weightKey: CONE_HEIGHT,
          maxRadius: GATHER,
        },
        inputs: { points: 'volcanoes' },
      },
    ]),
  );
  const chunks: Array<[number, number]> = [[0, 0], [1, 0], [-2, 3]];
  const anyLand = chunks.some(([cx, cy]) =>
    (JSON.parse(fieldBytes(reference.evaluator, 'birth', cx, cy)) as number[]).some((value) => value !== 0),
  );
  check('the island birth fixture really does dry some land, so a matching field is not two fields of never', anyLand);
  check(
    'reading the earliest born date of every point whose shape clears sea level is the island birth field, cell for cell',
    chunks.every(
      ([cx, cy]) =>
        fieldBytes(reference.evaluator, 'birth', cx, cy) === fieldBytes(built.evaluator, 'birth', cx, cy),
    ),
  );
}

function checkACraterArrivesAsAProfileShape(check: CheckReporter): void {
  const cone = agedCone(
    { x: 0, y: 0, born: -CONE_GROWTH_SPAN / 2, chainId: 0, radius: 40, height: 0.9 },
    { time: 0, erosionHalfLife: HALF_LIFE, shoulder: 0 },
  )!;
  const rim = { shape: PROFILE_RIM, levels: 4, bands: 3, rimDepth: 0.12 };
  const distances = [0, 1, 3, 7, 12, 25, 39];
  check('the fixture cone is young enough to still have a crater', cone.young);
  check(
    'the rim profile is the volcano crater dip, worked out per cone and to the same bit',
    distances.every(
      (distance) =>
        stampValueAt(distance, cone.radius, cone.height, rim) ===
        agedConeHeightAt(cone, distance, 0, 0.12),
    ),
  );
  check(
    'a rim with no depth is the plain power cone, so one profile serves domes and craters alike',
    distances.every(
      (distance) =>
        stampValueAt(distance, cone.radius, cone.height, { ...rim, rimDepth: 0 }) ===
        agedConeHeightAt({ ...cone, young: false }, distance, 0, 0.12),
    ),
  );
}

function checkScatterCarriesWhatAStampNeeds(check: CheckReporter): void {
  const world = worldFromState(
    stateOfNodes([
      {
        id: 'seeds',
        type: 'scatterPoints',
        params: { density: 0.02, radiusMin: 3, radiusMax: 9, weightMin: 0.2, weightMax: 0.8 },
        inputs: {},
      },
    ]),
  );
  const points = pointsWithin(world, 'seeds', 1);
  const reads = (point: WorldPoint, key: string) => point.data?.[key] ?? NaN;
  check('a scatter drops points to read attributes off', points.length > 0);
  check(
    'every scattered point carries its own radius, weight and angle inside the bands asked for',
    points.every(
      (point) =>
        reads(point, STAMP_RADIUS) >= 3 &&
        reads(point, STAMP_RADIUS) <= 9 &&
        reads(point, STAMP_WEIGHT) >= 0.2 &&
        reads(point, STAMP_WEIGHT) <= 0.8 &&
        reads(point, ANGLE) >= 0 &&
        reads(point, ANGLE) < Math.PI * 2,
    ),
  );
  check(
    'those attributes vary from point to point rather than being one number repeated',
    new Set(points.map((point) => reads(point, STAMP_RADIUS))).size > 1,
  );
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
      id: 'founded',
      type: 'settlementSpread',
      params: { landfallPitch: 512, spacing: 96, minScore: 0.3, spreadSpeed: 0.8, qualityHaste: 60 },
      inputs: { habitability: 'ground', travelCost: 'travel' },
    },
    { id: 'villages', type: 'bornFilter', params: {}, inputs: { source: 'founded' } },
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
    {
      id: 'attached',
      type: 'attachToNearest',
      params: {
        maxReach: 176,
        delay: 70,
        copyFromSource: STAMP_WEIGHT,
        copyFromAnchor: BORN,
      },
      inputs: { sources: 'deposits', anchors: 'villages' },
    },
  ]);
}

function checkAttachingToTheNearestFoundsTheSameCamps(check: CheckReporter): void {
  const world = worldFromState(settlementFixture());
  const camps = pointsWithin(world, 'camps', 2);
  const attached = pointsWithin(world, 'attached', 2);
  const reads = (point: WorldPoint, key: string) => point.data?.[key];
  check('the settlement fixture really does found camps to compare', camps.length > 0);
  check(
    'attaching to the nearest anchor stands the same points on the same spots, dated from the same claimant',
    camps.length === attached.length &&
      camps.every((camp, at) => {
        const twin = attached[at]!;
        return (
          twin.x === camp.x &&
          twin.y === camp.y &&
          reads(twin, BORN) === reads(camp, BORN) &&
          reads(twin, ANCHOR_X) === reads(camp, SENT_FROM_X) &&
          reads(twin, ANCHOR_Y) === reads(camp, SENT_FROM_Y)
        );
      }),
  );
  check(
    'the attribute named on the carry knob rides across from the source point',
    attached.every((point) => typeof reads(point, STAMP_WEIGHT) === 'number'),
  );
}

function pointsWithin(
  world: ReturnType<typeof worldFromState>,
  nodeId: string,
  span: number,
): WorldPoint[] {
  const points: WorldPoint[] = [];
  for (let chunkY = -span; chunkY <= span; chunkY++) {
    for (let chunkX = -span; chunkX <= span; chunkX++) {
      points.push(...(asPoints(world.evaluator.valueFor(nodeId, chunkX, chunkY)) ?? []));
    }
  }
  return points;
}

function sampleCells(): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < CHUNK_SIZE; y += 7) {
    for (let x = 0; x < CHUNK_SIZE; x += 7) cells.push({ x, y });
  }
  return cells;
}
