import { examplePipelines } from '@/features/asset-library/worlds/presets/examplePipelines';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { CLIMB_LIMIT } from '@/features/game/climbing';
import { worldFromPipelineState, type HeadlessWorld } from './headlessWorld';

const SPAN = 96;
const SHADES = ' .:-=+*#%@';

const worldName = flag('--world') ?? 'mesa badlands';
const originX = Number(flag('--x') ?? 0);
const originY = Number(flag('--y') ?? 0);

const example = examplePipelines().find((entry) => entry.name === worldName);
if (!example) {
  const names = examplePipelines().map((entry) => entry.name).join(', ');
  throw new Error(`no example world named ${worldName}: try one of ${names}`);
}

const world = worldFromPipelineState(example.state as PipelineState);
reportNodesSurvived(example.state as PipelineState, world);
const elevations = sampleElevations(world);
reportSpread(elevations);
reportHeightMap(elevations);
reportCrossSection(elevations);
reportReachability(elevations);
reportTiles(world);

function sampleElevations(headless: HeadlessWorld): Float64Array {
  const values = new Float64Array(SPAN * SPAN);
  for (let y = 0; y < SPAN; y++) {
    for (let x = 0; x < SPAN; x++) {
      values[y * SPAN + x] = headless.sampler.elevationAt(originX + x, originY + y);
    }
  }
  return values;
}

function reportNodesSurvived(state: PipelineState, headless: HeadlessWorld): void {
  const asked = state.nodes.length;
  const kept = headless.store.nodes().length;
  console.log(`world "${worldName}" at ${originX},${originY}`);
  console.log(`nodes: ${kept} of ${asked} survived sanitize${kept === asked ? '' : ' — SOME WERE DROPPED'}`);
}

function reportSpread(values: Float64Array): void {
  let min = Infinity;
  let max = -Infinity;
  let total = 0;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
    total += value;
  }
  const mean = total / values.length;
  console.log(`elevation: min ${min.toFixed(3)} max ${max.toFixed(3)} mean ${mean.toFixed(3)} spread ${(max - min).toFixed(3)}`);
  if (max - min < CLIMB_LIMIT) {
    console.log(`  FLAT: the whole ${SPAN}x${SPAN} window spans less than one climb step — nothing here reads as relief`);
  }
  console.log(`navigation levels present: ${[...new Set([...values].map((v) => Math.round(v)))].sort((a, b) => a - b).join(' ')}`);
}

function reportHeightMap(values: Float64Array): void {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-6, max - min);
  console.log(`\nelevation map (${SHADES[0]} low → ${SHADES[SHADES.length - 1]} high), one char per 2 tiles:`);
  for (let y = 0; y < SPAN; y += 2) {
    let row = '';
    for (let x = 0; x < SPAN; x += 1) {
      const shade = Math.min(SHADES.length - 1, Math.floor(((values[y * SPAN + x]! - min) / span) * SHADES.length));
      row += SHADES[shade];
    }
    console.log(row);
  }
}

function reportCrossSection(values: Float64Array): void {
  const row = Math.floor(SPAN / 2);
  console.log(`\ncross-section along y=${originY + row}, as navigation levels (round of scaled elevation):`);
  const levels: number[] = [];
  for (let x = 0; x < SPAN; x++) levels.push(Math.round(values[row * SPAN + x]!));
  console.log(levels.join(' '));

  let walls = 0;
  let flatRuns = 0;
  let runLength = 0;
  for (let x = 1; x < levels.length; x++) {
    const step = Math.abs(levels[x]! - levels[x - 1]!);
    if (step > CLIMB_LIMIT) walls++;
    if (step === 0) runLength++;
    else {
      if (runLength >= 4) flatRuns++;
      runLength = 0;
    }
  }
  if (runLength >= 4) flatRuns++;
  console.log(`  blocking steps (> CLIMB_LIMIT ${CLIMB_LIMIT}): ${walls}`);
  console.log(`  flat runs of 4+ tiles: ${flatRuns}`);
  console.log(`  reads as mesas if there are several blocking steps AND several flat runs`);
}

function reportReachability(values: Float64Array): void {
  const levels = [...values].map((value) => Math.round(value));
  let lowest = 0;
  for (let i = 1; i < levels.length; i++) if (levels[i]! < levels[lowest]!) lowest = i;

  const seen = new Uint8Array(levels.length);
  const stack = [lowest];
  seen[lowest] = 1;
  while (stack.length > 0) {
    const at = stack.pop()!;
    const x = at % SPAN;
    const y = Math.floor(at / SPAN);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= SPAN || ny >= SPAN) continue;
      const next = ny * SPAN + nx;
      if (seen[next] === 1) continue;
      if (Math.abs(levels[next]! - levels[at]!) > CLIMB_LIMIT) continue;
      seen[next] = 1;
      stack.push(next);
    }
  }

  let reached = 0;
  let reachedHighest = -Infinity;
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] !== 1) continue;
    reached++;
    if (levels[i]! > reachedHighest) reachedHighest = levels[i]!;
  }
  const highest = Math.max(...levels);
  console.log(`\nreachability by walking from the lowest cell (climb limit ${CLIMB_LIMIT}):`);
  console.log(`  reached ${((reached / levels.length) * 100).toFixed(1)}% of the window`);
  console.log(`  climbed from level ${levels[lowest]} to ${reachedHighest} of a possible ${highest}`);
  if (reachedHighest < highest) {
    console.log(`  SEALED: the top ${highest - reachedHighest} level(s) cannot be walked to from the floor`);
  }
}

function reportTiles(headless: HeadlessWorld): void {
  const counts = new Map<string, number>();
  for (let y = 0; y < SPAN; y++) {
    for (let x = 0; x < SPAN; x++) {
      const tileId = headless.sampler.tileAt(originX + x, originY + y);
      const name = headless.tileAssets.byId(tileId)?.name ?? `#${tileId}`;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const cells = SPAN * SPAN;
  console.log('\ntile coverage:');
  for (const [name, count] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name.padEnd(22)} ${((count / cells) * 100).toFixed(1)}%`);
  }
}

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
