import '../procgen/nodes';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { labelSeed } from '../procgen/random/labelSeed';
import { PRESENT } from '../procgen/time/worldTime';
import type { WorldPoint } from '../procgen/values/chunkValues';
import { BORN, CHAIN_ID, CONE_HEIGHT, CONE_RADIUS, pointNumber } from '../procgen/values/pointData';
import { asPoints } from '../procgen/values/valueAccess';
import { coneProfileAt } from '../procgen/volcanic/coneProfile';
import { conesOverlapping, type HotspotChainSpec } from '../procgen/volcanic/hotspotChains';
import type { CheckReporter } from './checkReporter';
import { fieldAt, fieldBytes, stateOfNodes, worldFromState } from './pipelineWorldFixtures';

const SEA_LEVEL = 0.45;
const SEAFLOOR_BASE = SEA_LEVEL * 0.55;
const SAMPLED_TIMES = [-4_500_000, -2_500_000, -1_000_000, PRESENT];

const FIXTURE_CHAIN_SPEC = {
  hotspotSpacing: 256,
  driftRate: 0.0001,
  eruptionPeriod: 500_000,
  coneRadius: 40,
  coneHeight: 1,
  chainFraction: 0.4,
};

type World = ReturnType<typeof worldFromState>;

function volcanicState(): PipelineState {
  return stateOfNodes([
    { id: 'volcanoes', type: 'hotspotChain', params: FIXTURE_CHAIN_SPEC, inputs: {} },
    { id: 'cones', type: 'volcanoConeField', params: { seaLevel: SEA_LEVEL, erosionHalfLife: 2_500_000, craterDepth: 0.1, shoulder: 12 }, inputs: { volcanoes: 'volcanoes' } },
    { id: 'birth', type: 'islandBirthField', params: { seaLevel: SEA_LEVEL }, inputs: { volcanoes: 'volcanoes' } },
    { id: 'fertility', type: 'volcanicFertility', params: { ashRadius: 40, peakAge: 2_000_000, altitudePenalty: 0.2 }, inputs: { volcanoes: 'volcanoes', elevation: 'cones' } },
    { id: 'deposits', type: 'mineralDeposits', params: { density: 0.05, minIslandAge: 1_000_000, richnessScale: 1 }, inputs: { volcanoes: 'volcanoes', elevation: 'cones' } },
  ]);
}

function pointsIn(world: World, nodeId: string, span: number): WorldPoint[] {
  const points: WorldPoint[] = [];
  for (let chunkY = -span; chunkY <= span; chunkY++) {
    for (let chunkX = -span; chunkX <= span; chunkX++) {
      points.push(...(asPoints(world.evaluator.valueFor(nodeId, chunkX, chunkY)) ?? []));
    }
  }
  return points;
}

function pointBytes(points: WorldPoint[]): string {
  return JSON.stringify(points);
}

function coneTuple(point: WorldPoint): number[] {
  return [
    point.x,
    point.y,
    pointNumber(point, BORN, 0),
    pointNumber(point, CHAIN_ID, 0),
    pointNumber(point, CONE_RADIUS, 0),
    pointNumber(point, CONE_HEIGHT, 0),
  ];
}

function sortedConeTuples(cones: number[][]): string {
  const byPosition = (a: number[], b: number[]) =>
    a[0]! - b[0]! || a[1]! - b[1]! || a[2]! - b[2]! || a[3]! - b[3]!;
  return JSON.stringify([...cones].sort(byPosition));
}

function chainsOf(points: WorldPoint[]): Map<number, WorldPoint[]> {
  const chains = new Map<number, WorldPoint[]>();
  for (const point of points) {
    const id = pointNumber(point, CHAIN_ID, 0);
    chains.set(id, [...(chains.get(id) ?? []), point]);
  }
  return chains;
}

function agesAlongDrift(cones: WorldPoint[]): boolean {
  const youngestFirst = [...cones].sort((a, b) => pointNumber(b, BORN, 0) - pointNumber(a, BORN, 0));
  const head = youngestFirst[0]!;
  let lastDistance = -1;
  for (const cone of youngestFirst) {
    const distance = Math.hypot(cone.x - head.x, cone.y - head.y);
    if (distance <= lastDistance) return false;
    lastDistance = distance;
  }
  return true;
}

function isWellInsideCollectedSpan(cone: WorldPoint): boolean {
  return Math.abs(cone.x) <= 220 && Math.abs(cone.y) <= 220;
}

function isClearOfOtherChains(cone: WorldPoint, all: WorldPoint[], clearance: number): boolean {
  const chain = pointNumber(cone, CHAIN_ID, 0);
  return all.every(
    (other) =>
      pointNumber(other, CHAIN_ID, 0) === chain ||
      Math.hypot(other.x - cone.x, other.y - cone.y) >= clearance,
  );
}

function summitStandsAt(world: World, cone: WorldPoint, time: number): boolean {
  world.store.setTime(time);
  return fieldAt(world.evaluator, 'cones', cone.x, cone.y) > SEAFLOOR_BASE + 0.01;
}

function existenceMatchesBirth(world: World, cone: WorldPoint): boolean {
  const born = pointNumber(cone, BORN, 0);
  return SAMPLED_TIMES.every((time) => summitStandsAt(world, cone, time) === (born <= time));
}

function landCellCount(world: World, time: number): number {
  world.store.setTime(time);
  let land = 0;
  for (let y = -128; y < 128; y += 4) {
    for (let x = -128; x < 128; x += 4) {
      if (fieldAt(world.evaluator, 'cones', x, y) >= SEA_LEVEL) land++;
    }
  }
  return land;
}

function unerodedProfileCones(world: World): WorldPoint[] {
  return pointsIn(world, 'volcanoes', 5);
}

function expectedBirthAt(cones: WorldPoint[], x: number, y: number): number {
  let earliest = 0;
  for (const cone of cones) {
    const distance = Math.hypot(x - cone.x, y - cone.y);
    const profile = coneProfileAt(distance, pointNumber(cone, CONE_RADIUS, 0), pointNumber(cone, CONE_HEIGHT, 0));
    if (profile <= SEA_LEVEL) continue;
    const born = pointNumber(cone, BORN, 0);
    if (earliest === 0 || born < earliest) earliest = born;
  }
  return earliest;
}

function birthFieldMatches(world: World, cones: WorldPoint[]): boolean {
  for (let y = 0; y < 32; y += 3) {
    for (let x = 0; x < 32; x += 3) {
      const value = fieldAt(world.evaluator, 'birth', x, y);
      const expected = expectedBirthAt(cones, x, y);
      if (Math.fround(expected) !== value) return false;
      if (expected < 0 !== value < 0) return false;
    }
  }
  return true;
}

function fertilityInRange(world: World): boolean {
  for (let y = -32; y < 32; y += 2) {
    for (let x = -32; x < 32; x += 2) {
      const value = fieldAt(world.evaluator, 'fertility', x, y);
      if (value < 0 || value > 1) return false;
    }
  }
  return true;
}

function coneBornBetween(
  cones: WorldPoint[],
  youngest: number,
  oldest: number,
  clearance: number,
): WorldPoint | undefined {
  return cones.find(
    (cone) =>
      pointNumber(cone, BORN, 0) <= youngest &&
      pointNumber(cone, BORN, 0) >= oldest &&
      isWellInsideCollectedSpan(cone) &&
      isClearOfOtherChains(cone, cones, clearance),
  );
}

function depositHasAgedHost(deposit: WorldPoint, cones: WorldPoint[], minAge: number): boolean {
  return cones.some(
    (cone) =>
      -pointNumber(cone, BORN, 0) >= minAge &&
      Math.hypot(deposit.x - cone.x, deposit.y - cone.y) <= 1.2 * pointNumber(cone, CONE_RADIUS, 0) + 0.5,
  );
}

function pureSpec(world: World): HotspotChainSpec {
  return {
    spacing: FIXTURE_CHAIN_SPEC.hotspotSpacing,
    driftRate: FIXTURE_CHAIN_SPEC.driftRate,
    eruptionPeriod: FIXTURE_CHAIN_SPEC.eruptionPeriod,
    coneRadius: FIXTURE_CHAIN_SPEC.coneRadius,
    coneHeight: FIXTURE_CHAIN_SPEC.coneHeight,
    chainFraction: FIXTURE_CHAIN_SPEC.chainFraction,
    seed: labelSeed(world.store.seed(), 'volcanoes', 'hotspot lattice'),
  };
}

export function checkVolcanicWorldInvariants(check: CheckReporter): void {
  const world = worldFromState(volcanicState());
  const again = worldFromState(volcanicState());
  check(
    'a volcanic chunk regenerates identical cones, fields and deposits from the same seed',
    pointBytes(pointsIn(world, 'volcanoes', 0)) === pointBytes(pointsIn(again, 'volcanoes', 0)) &&
      fieldBytes(world.evaluator, 'cones', 0, 0) === fieldBytes(again.evaluator, 'cones', 0, 0) &&
      pointBytes(pointsIn(world, 'deposits', 1)) === pointBytes(pointsIn(again, 'deposits', 1)),
  );

  const cones = pointsIn(world, 'volcanoes', 10);
  const chains = [...chainsOf(cones).values()].filter((chain) => chain.length >= 3);
  check('the fixture yields several chains with at least three cones to reason about', chains.length >= 3);
  check(
    'within a chain, cones farther from the hotspot head are strictly older',
    chains.every(agesAlongDrift),
  );

  const lonely = cones.filter(
    (cone) => isWellInsideCollectedSpan(cone) && isClearOfOtherChains(cone, cones, 60),
  );
  const watched = lonely.filter((cone) => pointNumber(cone, BORN, 0) >= -2_100_000).slice(0, 6);
  check('some isolated young-enough cones exist to watch through time', watched.length >= 2);
  check(
    'a cone stands in the field at exactly the sampled times its birth date has passed',
    watched.every((cone) => existenceMatchesBirth(world, cone)),
  );

  const defaultWorld = worldFromState(volcanicState());
  const defaultBytes = fieldBytes(defaultWorld.evaluator, 'cones', 0, 0);
  world.store.setTime(-4_500_000);
  const pastLand = landCellCount(world, -4_500_000);
  const presentLand = landCellCount(world, PRESENT);
  world.store.setTime(PRESENT);
  check(
    'the cone field at PRESENT equals the default evaluation and the deep past holds strictly less land',
    fieldBytes(world.evaluator, 'cones', 0, 0) === defaultBytes && pastLand < presentLand,
  );

  check(
    'island birth is 0 where no cone ever clears the sea, else the earliest clearing born date',
    birthFieldMatches(world, unerodedProfileCones(world)),
  );

  const oldFlankCone = coneBornBetween(cones, -1_550_000, -2_550_000, 60);
  const youngCone = coneBornBetween(cones, -50_000, -50_000, 60);
  check('an isolated old cone and an isolated newborn cone exist to compare soils', !!oldFlankCone && !!youngCone);
  const oldFlank = oldFlankCone
    ? fieldAt(world.evaluator, 'fertility', oldFlankCone.x + 20, oldFlankCone.y)
    : 0;
  const youngRock = youngCone ? fieldAt(world.evaluator, 'fertility', youngCone.x, youngCone.y) : 1;
  check(
    'fertility stays inside 0..1 and an old cone flank outgrows the bare rock of a newborn cone',
    fertilityInRange(world) && oldFlank > youngRock,
  );

  const deposits = pointsIn(world, 'deposits', 6);
  check('the fixture seeds deposits to inspect', deposits.length > 0);
  check(
    'every deposit sits above sea level within reach of a cone older than the minimum island age',
    deposits.every(
      (deposit) =>
        fieldAt(world.evaluator, 'cones', deposit.x, deposit.y) > SEA_LEVEL &&
        depositHasAgedHost(deposit, cones, 1_000_000),
    ) && pointBytes(deposits) === pointBytes(pointsIn(again, 'deposits', 6)),
  );

  const rect = { minX: -320, minY: -320, maxX: 352, maxY: 352 };
  const pureCones = conesOverlapping(rect, pureSpec(world)).map((cone) => [
    cone.x,
    cone.y,
    cone.born,
    cone.chainId,
    cone.radius,
    cone.height,
  ]);
  check(
    'chunks emit each cone exactly once with the payload the pure lattice predicts, so seams agree',
    sortedConeTuples(cones.map(coneTuple)) === sortedConeTuples(pureCones),
  );
}
