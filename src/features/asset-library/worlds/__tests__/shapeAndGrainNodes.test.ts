import '../nodes';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { CLIMB_LIMIT, navigationLevelOf } from '@/features/game/climbing';
import type { PipelineEvaluator } from '../eval/evaluator';
import type { PipelineState } from '../pipeline/pipelineState';
import {
  PROFILE_BELL,
  PROFILE_RAMP,
  PROFILE_RING,
  PROFILE_SAWTOOTH,
  PROFILE_STEPS,
  profileValueAt,
  type FieldProfile,
} from '../shape/fieldProfile';
import { asField } from '../values/valueAccess';
import { fieldAt, stateOfNodes, worldFromState } from './pipelineWorldFixtures';

const FLOOR_HALF_WIDTH = 6;
const WALL_WIDTH = 2;
const CANYON_FLOOR = 0.2;
const BLOCKS_PER_UNIT = 12;
const TERRAIN_NOISE_DIGEST = 77147793;
const TECTONIC_UPLIFT_DIGEST = 1331796678;

function shapeState(): PipelineState {
  return stateOfNodes([
    { id: 'terrain', type: 'terrainNoise', params: { scale: 0.01, style: 0, octaves: 4, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'flat', type: 'constantField', params: { value: 0.1 }, inputs: {} },
    { id: 'shore', type: 'distanceToThreshold', params: { level: 0.5, range: 32 }, inputs: { elevation: 'terrain' } },
    {
      id: 'canyon',
      type: 'shapeByField',
      params: { profile: 5, op: 4, amount: 1, center: 0.5, controlRange: 32, floorHalfWidth: FLOOR_HALF_WIDTH, wallWidth: WALL_WIDTH, wallCurve: 1, levelValue: CANYON_FLOOR },
      inputs: { base: 'terrain', control: 'shore' },
    },
    {
      id: 'cut',
      type: 'shapeByField',
      params: { profile: 5, op: 0, amount: 0.4, center: 0.5, controlRange: 32, floorHalfWidth: FLOOR_HALF_WIDTH, wallWidth: WALL_WIDTH, wallCurve: 1 },
      inputs: { base: 'flat', control: 'shore' },
    },
    {
      id: 'rim',
      type: 'shapeByField',
      params: { profile: PROFILE_RING, op: 1, amount: 0.2, center: 0.5, width: 0.3 },
      inputs: { base: 'terrain', control: 'shore' },
    },
    {
      id: 'terraces',
      type: 'shapeByField',
      params: { profile: PROFILE_STEPS, op: 4, amount: 1, center: 0.5, width: 0.6, levels: 4, levelValue: 0.9 },
      inputs: { base: 'flat', control: 'shore' },
    },
    { id: 'sunlit', type: 'remapField', params: { mode: PROFILE_BELL, center: 0.5, width: 0.4, low: 0.2, high: 0.8, invert: 0 }, inputs: { source: 'terrain' } },
    { id: 'shaded', type: 'remapField', params: { mode: PROFILE_BELL, center: 0.5, width: 0.4, low: 0.2, high: 0.8, invert: 1 }, inputs: { source: 'terrain' } },
    { id: 'aspect', type: 'gradientDirection', params: { radius: 2 }, inputs: { source: 'terrain' } },
    { id: 'flatAspect', type: 'gradientDirection', params: { radius: 2 }, inputs: { source: 'flat' } },
    { id: 'regions', type: 'voronoiRegions', params: { pitch: 64, jitter: 1, output: 0 }, inputs: {} },
    { id: 'seams', type: 'voronoiRegions', params: { pitch: 64, jitter: 1, output: 1 }, inputs: {} },
    { id: 'grid', type: 'voronoiRegions', params: { pitch: 64, jitter: 0, output: 0 }, inputs: {} },
    { id: 'plates', type: 'tectonicUplift', params: { plateSize: 256, oceanFraction: 0.6, beltWidth: 64, rangeHeight: 0.34, landHeight: 0.58, basinDepth: 0.34 }, inputs: {} },
    { id: 'plainNoise', type: 'terrainNoise', params: { scale: 0.02, style: 1, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'dunes', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5, angle: 0, stretch: 8 }, inputs: {} },
    { id: 'rolling', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
  ]);
}

export function checkShapeAndGrainNodes(check: CheckReporter): void {
  const world = worldFromState(shapeState());
  const read = (nodeId: string, x: number, y: number) => fieldAt(world.evaluator, nodeId, x, y);
  const row = (nodeId: string, y: number, from: number, to: number) => {
    const values: number[] = [];
    for (let x = from; x < to; x++) values.push(read(nodeId, x, y));
    return values;
  };

  checkTheProfileCurves(check);
  checkRemapWritesBetweenLowAndHigh(check, row);
  checkTheCanyonCase(check, row);
  checkTheOtherShapes(check, row);
  checkVoronoiRegions(check, row);
  checkGradientDirection(check, read);
  checkTheGrainKnobsLeaveTheOldNoiseAlone(check, world.evaluator, row);
}

function profileOf(shape: number, invert = false): FieldProfile {
  return { shape, center: 0.5, width: 0.4, levels: 4, invert };
}

function checkTheProfileCurves(check: CheckReporter): void {
  const ramp = profileOf(PROFILE_RAMP);
  check(
    'the ramp runs from 0 half a width below the centre to 1 half a width above it',
    profileValueAt(0.29, ramp) === 0 && profileValueAt(0.5, ramp) === 0.5 && profileValueAt(0.71, ramp) === 1,
  );
  const bell = profileOf(PROFILE_BELL);
  check(
    'the bell peaks at the centre and is back to nothing half a width out',
    profileValueAt(0.5, bell) === 1 && profileValueAt(0.3, bell) < 1e-9 && profileValueAt(0.7, bell) < 1e-9,
  );
  const ring = profileOf(PROFILE_RING);
  check(
    'the ring is hollow at the centre, peaks half a width out on both sides, and is gone a full width out',
    profileValueAt(0.5, ring) === 0 &&
      profileValueAt(0.3, ring) === 1 &&
      profileValueAt(0.7, ring) === 1 &&
      profileValueAt(0.9, ring) === 0 &&
      profileValueAt(0.1, ring) === 0,
  );
  const sawtooth = profileOf(PROFILE_SAWTOOTH);
  check(
    'the sawtooth repeats every width',
    Math.abs(profileValueAt(0.6, sawtooth) - profileValueAt(1.0, sawtooth)) < 1e-9,
  );
  const steps = profileOf(PROFILE_STEPS);
  const stepValues = new Set<number>();
  for (let i = 0; i <= 200; i++) stepValues.add(profileValueAt(i / 200, steps));
  check('the stair has exactly as many levels as it was asked for', stepValues.size === 4);
  check(
    'inverting a curve is the same curve upside down',
    profileValueAt(0.5, profileOf(PROFILE_BELL, true)) === 0,
  );
}

function checkRemapWritesBetweenLowAndHigh(
  check: CheckReporter,
  row: (nodeId: string, y: number, from: number, to: number) => number[],
): void {
  const sunlit = row('sunlit', 0, -120, 120);
  const shaded = row('shaded', 0, -120, 120);
  check(
    'remap field never leaves the low and high it was given',
    sunlit.every((value) => value >= 0.2 - 1e-6 && value <= 0.8 + 1e-6),
  );
  check(
    'the invert toggle mirrors the curve inside that same span',
    sunlit.every((value, i) => Math.abs(value + shaded[i]! - 1) < 1e-6),
  );
  check('remap field actually varies rather than writing one value', new Set(sunlit).size > 10);
}

function checkTheCanyonCase(
  check: CheckReporter,
  row: (nodeId: string, y: number, from: number, to: number) => number[],
): void {
  const canyon = row('canyon', 0, -160, 160);
  const floor = longestRun(canyon, (value) => Math.abs(value - CANYON_FLOOR) < 1e-6);
  check(
    `the canyon floor is flat at the level for at least the ${2 * FLOOR_HALF_WIDTH} tiles the floor half width asks for`,
    floor.length >= 2 * FLOOR_HALF_WIDTH,
  );
  const wall = canyon.slice(floor.start + floor.length - 1, floor.start + floor.length + WALL_WIDTH + 1);
  check(
    'the wall out of that floor climbs more than a step in a single tile',
    wall.some(
      (value, i) =>
        i > 0 &&
        navigationLevelOf(value * BLOCKS_PER_UNIT) - navigationLevelOf(wall[i - 1]! * BLOCKS_PER_UNIT) >
          CLIMB_LIMIT,
    ),
  );
  const cut = row('cut', 0, -160, 160);
  check(
    'a subtracted cut is allowed below 0 rather than quietly clamped',
    Math.min(...cut) < 0,
  );
}

function checkTheOtherShapes(
  check: CheckReporter,
  row: (nodeId: string, y: number, from: number, to: number) => number[],
): void {
  const base = row('terrain', 0, -160, 160);
  const rim = row('rim', 0, -160, 160);
  check(
    'a ring added to terrain raises a rim in some places and leaves others alone',
    rim.every((value, i) => value >= base[i]! - 1e-9) &&
      rim.some((value, i) => value > base[i]! + 0.05) &&
      rim.some((value, i) => Math.abs(value - base[i]!) < 1e-9),
  );
  const terraces = new Set(row('terraces', 0, -160, 160).map((value) => value.toFixed(6)));
  check(
    'steps pulled to a level land on that many flat heights and no more',
    terraces.size > 1 && terraces.size <= 4,
  );
}

function checkVoronoiRegions(
  check: CheckReporter,
  row: (nodeId: string, y: number, from: number, to: number) => number[],
): void {
  const ids = row('regions', 0, -128, 128);
  check(
    'the region id is one steady value per region, several of them across a row',
    new Set(ids).size >= 3 &&
      [...new Set(ids)].some((id) => longestRun(ids, (value) => value === id).length > 8),
  );
  check('every region id is a fraction a multiply can use', ids.every((value) => value >= 0 && value <= 1));
  const seams = row('seams', 0, -128, 128);
  check(
    'boundary distance is 0..1 and reaches nearly 0 where a seam crosses the row',
    seams.every((value) => value >= 0 && value <= 1) && Math.min(...seams) < 0.05,
  );
  const grid = row('grid', 0, -128, 128);
  const boundaries: number[] = [];
  for (let i = 1; i < grid.length; i++) if (grid[i] !== grid[i - 1]) boundaries.push(i);
  check(
    'with no jitter the regions are a plain grid on the pitch',
    boundaries.length >= 2 && boundaries.every((at, i) => i === 0 || at - boundaries[i - 1]! === 64),
  );
}

function checkGradientDirection(
  check: CheckReporter,
  read: (nodeId: string, x: number, y: number) => number,
): void {
  const samples: [number, number][] = [
    [10, 20],
    [-33, 7],
    [64, -40],
  ];
  check(
    'gradient direction is the turn fraction of the same difference slope measures',
    samples.every(([x, y]) => {
      const acrossX = read('terrain', x + 2, y) - read('terrain', x - 2, y);
      const acrossY = read('terrain', x, y + 2) - read('terrain', x, y - 2);
      const expected = Math.atan2(acrossY, acrossX) / (Math.PI * 2) + 0.5;
      return Math.abs(read('aspect', x, y) - expected) < 1e-6;
    }),
  );
  check(
    'ground with no slope has no direction to report and reads 0.5',
    read('flatAspect', 3, 4) === 0.5 && read('flatAspect', -20, 11) === 0.5,
  );
}

function checkTheGrainKnobsLeaveTheOldNoiseAlone(
  check: CheckReporter,
  evaluator: PipelineEvaluator,
  row: (nodeId: string, y: number, from: number, to: number) => number[],
): void {
  check(
    'terrain noise at the default angle and stretch is byte for byte the noise it made before it had them',
    chunkDigest(evaluator, 'plainNoise') === TERRAIN_NOISE_DIGEST,
  );
  check(
    'the jitter knob the voronoi node needed left tectonic uplift generating exactly what it did',
    chunkDigest(evaluator, 'plates') === TECTONIC_UPLIFT_DIGEST,
  );
  const rolling = row('rolling', 0, -60, 60);
  const dunes = row('dunes', 0, -60, 60);
  check(
    'stretching the grain leaves the pattern as busy across the wind as it ever was',
    Math.abs(meanStep(dunes) - meanStep(rolling)) < meanStep(rolling) * 0.5,
  );
  const alongDunes: number[] = [];
  const alongRolling: number[] = [];
  for (let y = -60; y < 60; y++) {
    alongDunes.push(fieldAt(evaluator, 'dunes', 0, y));
    alongRolling.push(fieldAt(evaluator, 'rolling', 0, y));
  }
  check(
    'and draws it out along the crests, so it changes far more slowly that way',
    meanStep(alongDunes) < meanStep(alongRolling) / 3,
  );
}

function chunkDigest(evaluator: PipelineEvaluator, nodeId: string): number {
  let digest = 0;
  for (const [chunkX, chunkY] of [
    [0, 0],
    [3, -2],
  ] as const) {
    const field = asField(evaluator.valueFor(nodeId, chunkX, chunkY)) ?? new Float32Array();
    for (let i = 0; i < field.length; i++) digest = (digest * 31 + Math.round(field[i]! * 1e6)) % 2147483647;
  }
  return digest;
}

function meanStep(values: readonly number[]): number {
  let sum = 0;
  for (let i = 1; i < values.length; i++) sum += Math.abs(values[i]! - values[i - 1]!);
  return sum / (values.length - 1);
}

function longestRun(
  values: readonly number[],
  matches: (value: number) => boolean,
): { start: number; length: number } {
  let best = { start: 0, length: 0 };
  let run = 0;
  values.forEach((value, i) => {
    run = matches(value) ? run + 1 : 0;
    if (run > best.length) best = { start: i - run + 1, length: run };
  });
  return best;
}
