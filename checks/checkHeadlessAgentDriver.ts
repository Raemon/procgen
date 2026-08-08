import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { headlessServerWorld } from '../api/agent/headless/headlessServerWorld';
import { currentServerWorld } from '../api/agent/persistedServerWorld';
import type { ServerWorld } from '../api/agent/serverWorld';
import type { StoredWorldJson } from '../api/agent/serverWorldAssets';
import { agentDriver } from '../tools/explore/drivers/agentDriver';
import type { AgentPolicy } from '../tools/explore/drivers/agentPolicy';
import { driverFromEnvironment } from '../tools/explore/drivers/driverFromEnvironment';
import { explorerWalkDriver } from '../tools/explore/drivers/explorerWalkDriver';
import { policyFromEnvironment } from '../tools/explore/drivers/policyFromEnvironment';
import { scriptedExplorerPolicy } from '../tools/explore/drivers/scriptedExplorerPolicy';
import { cachedTileIdProbe, walkableProbeFrom } from '../tools/explore/cachedWorldProbes';
import type { ExplorationTrace } from '../tools/explore/explorationTrace';
import { spawnNearOrigin } from '../tools/explore/spawnPoint';
import type { CheckReporter } from './checkReporter';
import { earthlikeState } from './pipelineWorldFixtures';

const DRIVER_SOURCE_DIR = 'tools/explore/drivers';
const MUTABLE_COLLECTIONS = [
  'PipelineStore',
  'TileAssets',
  'PieceAssets',
  'CultureAssets',
  'CreatureAssets',
  'ItemAssets',
  'TemplateLibrary',
  'WorldPresetLibrary',
  'PuzzleWorld',
  'PuzzleState',
];
const SAMPLED_SPAN = 24;
const WALK_LIMITS = { stepBudget: 150, radiusCap: 60 };

export async function checkHeadlessAgentDriver(check: CheckReporter): Promise<void> {
  checkOneFactoryBuildsBothWorlds(check);
  await checkAScriptedAgentRunRepeats(check);
  await checkDriversCanOnlyActThroughTheAbilityLayer(check);
  checkTheCostlyPolicyIsOptIn(check);
}

function checkOneFactoryBuildsBothWorlds(check: CheckReporter): void {
  const read = storedJsonOfAnEarthlikeWorld();
  const served = currentServerWorld({ read: (name) => read(name), stamp: () => 'stored' }, null);
  const headless = headlessServerWorld(read);
  check(
    'a headless world carries every part a served world does, so nothing is wired up on the server path alone',
    partNamesOf(served).join(',') === partNamesOf(headless).join(','),
  );
  check(
    'the same stored json yields the same tileset either way',
    served.tileAssets.all().length === headless.tileAssets.all().length &&
      served.tileAssets.all().every((tile, index) => tile.id === headless.tileAssets.all()[index]!.id),
  );
  check(
    'the same stored json yields the same terrain and the same spawn either way',
    sampledTerrainOf(served) === sampledTerrainOf(headless) &&
      JSON.stringify(served.spawn()) === JSON.stringify(headless.spawn()),
  );
}

async function checkAScriptedAgentRunRepeats(check: CheckReporter): Promise<void> {
  const first = await scriptedRun(7);
  const repeated = await scriptedRun(7);
  const elsewhere = await scriptedRun(99);
  check(
    'a scripted agent run replays cell for cell from its seed, so a ranking can be reproduced',
    pathOf(first) === pathOf(repeated),
  );
  check(
    'a different seed sends the scripted agent somewhere else, so the seed is what drives it',
    pathOf(first) !== pathOf(elsewhere),
  );
  check(
    'the agent only ever stands one tile from where it stood, because it moves by taking steps',
    everyStepIsOneTile(first),
  );
  check(
    'every cell the agent reaches is one the world calls walkable, so no driver walks through walls',
    everyCellIsWalkable(first),
  );
}

async function checkDriversCanOnlyActThroughTheAbilityLayer(check: CheckReporter): Promise<void> {
  const offenders = driverSources().filter((path) => holdsAMutableCollection(path));
  report('driver files holding a mutable collection', offenders);
  check(
    'no driver holds a mutable collection, so a driver can only change the world by performing an ability',
    offenders.length === 0,
  );
  const madeUp = await runWithPolicy(inventedActionPolicy());
  check(
    'an action no ability registers moves the agent nowhere, so the ability layer is what carries a driver',
    madeUp.path.every((cell) => cell.x === madeUp.spawn.x && cell.y === madeUp.spawn.y),
  );
}

function inventedActionPolicy(): AgentPolicy {
  return {
    name: 'invented',
    decide: () => Promise.resolve({ action: 'teleport_to_the_best_bit', params: {} }),
  };
}

function checkTheCostlyPolicyIsOptIn(check: CheckReporter): void {
  check(
    'the explorer walk is what an unasked-for driver gives you, so nothing reaches for an API key by default',
    driverFromEnvironment({}, 1) === explorerWalkDriver,
  );
  check(
    'asking for the llm policy without a key fails saying which key is missing, rather than doing nothing',
    keylessLlmPolicyComplaint().includes('ANTHROPIC_API_KEY'),
  );
}

function keylessLlmPolicyComplaint(): string {
  try {
    policyFromEnvironment({ AGENT_POLICY: 'llm' }, 1);
    return '';
  } catch (error) {
    return String(error);
  }
}

function scriptedRun(seed: number): Promise<ExplorationTrace> {
  return runWithPolicy(scriptedExplorerPolicy(seed), seed);
}

function runWithPolicy(policy: AgentPolicy, seed = 1): Promise<ExplorationTrace> {
  const world = headlessServerWorld(storedJsonOfAnEarthlikeWorld());
  const isWalkableAt = walkableProbeFrom(cachedTileIdProbe(world.sampler), world.tileAssets);
  const spawn = spawnNearOrigin(isWalkableAt)!;
  return agentDriver(policy).explore({ world, spawn, isWalkableAt, limits: WALK_LIMITS, seed });
}

function storedJsonOfAnEarthlikeWorld(): StoredWorldJson {
  const tiles: unknown = JSON.parse(readFileSync('data/tiles.json', 'utf8'));
  const pipeline = earthlikeState();
  return (name) => {
    if (name === 'tiles') return tiles;
    if (name === 'pipeline') return pipeline;
    return null;
  };
}

function partNamesOf(world: ServerWorld): string[] {
  return Object.keys(world)
    .filter((name) => name !== 'stamp')
    .sort();
}

function sampledTerrainOf(world: ServerWorld): string {
  const ids: number[] = [];
  for (let y = -SAMPLED_SPAN; y <= SAMPLED_SPAN; y += 3) {
    for (let x = -SAMPLED_SPAN; x <= SAMPLED_SPAN; x += 3) ids.push(world.sampler.tileAt(x, y));
  }
  return ids.join(',');
}

function pathOf(trace: ExplorationTrace): string {
  return trace.path.map((cell) => `${cell.x},${cell.y}`).join(' ');
}

function everyStepIsOneTile(trace: ExplorationTrace): boolean {
  return trace.path.every((cell, index) => {
    const previous = trace.path[index - 1] ?? cell;
    return Math.max(Math.abs(cell.x - previous.x), Math.abs(cell.y - previous.y)) <= 1;
  });
}

function everyCellIsWalkable(trace: ExplorationTrace): boolean {
  const world = headlessServerWorld(storedJsonOfAnEarthlikeWorld());
  return trace.path.every((cell) => world.isWalkable(cell.x, cell.y));
}

function driverSources(): string[] {
  return readdirSync(DRIVER_SOURCE_DIR)
    .filter((entry) => entry.endsWith('.ts'))
    .map((entry) => join(DRIVER_SOURCE_DIR, entry));
}

function holdsAMutableCollection(path: string): boolean {
  return valueImportedNames(readFileSync(path, 'utf8')).some((name) =>
    MUTABLE_COLLECTIONS.includes(name),
  );
}

function valueImportedNames(source: string): string[] {
  const names: string[] = [];
  for (const line of source.split('\n')) {
    const match = line.match(/^import \{([^}]*)\} from/);
    if (!match) continue;
    for (const specifier of match[1]!.split(',')) {
      const trimmed = specifier.trim();
      if (trimmed !== '' && !trimmed.startsWith('type ')) names.push(trimmed.split(' ')[0]!);
    }
  }
  return names;
}

function report(what: string, offenders: readonly string[]): void {
  if (offenders.length === 0) return;
  console.log(`     ${what}:\n       ${offenders.join('\n       ')}`);
}
