import '../nodes';
import { mulberry32 } from '../random/mulberry32';
import type { PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { clonedState } from '../randomize/clonedState';
import { freeGrownPipeline } from '../randomize/freeGrownPipeline';
import { insertNodeIntoWire } from '../randomize/pipelineMutations';
import { randomWorldPipeline } from '../randomize/randomWorldPipeline';
import { recipeTilesOf } from '../randomize/recipeTiles';
import { subgraphGraftedPipeline } from '../selfPlay/breedGenomes';
import { EliteArchive } from '../selfPlay/eliteArchive';
import { rolledGenome } from '../selfPlay/worldGenome';
import { scoredGenome, type ScoredWorld } from '../selfPlay/scoreGenome';
import { touristLimits } from '../walkingSim/touristWalk';
import { EMPTY_TILE } from '../values/chunkValues';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { islandsState, tileIdsInRegion, worldFromState } from './pipelineWorldFixtures';
import { fixtureTileAssets } from './walkingSimFixtures';

const freeTiles = recipeTilesOf(fixtureTileAssets.all());
const SMOKE_LIMITS = touristLimits(140, 90);
const SMOKE_WALK_SEED = 3;

export function checkFreeSearchAndFrontier(check: CheckReporter): void {
  checkFreeGrownPipelines(check);
  checkWiresGrowJoints(check);
  checkSubgraphGrafts(check);
  checkTheFrontierWing(check);
}

function checkFreeGrownPipelines(check: CheckReporter): void {
  const grownOnce = freeGrownPipeline(mulberry32(7), freeTiles);
  const grownTwice = freeGrownPipeline(mulberry32(7), freeTiles);
  check('free growth is deterministic per stream, so a wild world can be replayed', JSON.stringify(grownOnce) === JSON.stringify(grownTwice));
  check(
    'different streams grow different wildernesses',
    JSON.stringify(grownOnce) !== JSON.stringify(freeGrownPipeline(mulberry32(8), freeTiles)),
  );
  check(
    'a free-grown pipeline survives sanitize unchanged, so it is always a legal world',
    JSON.stringify(sanitizePipeline(grownOnce)) === JSON.stringify(grownOnce),
  );

  let deepChains = 0;
  let paintedWorlds = 0;
  const ROLLS = 10;
  for (let roll = 1; roll <= ROLLS; roll++) {
    const grown = freeGrownPipeline(mulberry32(roll * 53), freeTiles);
    if (longestChainOf(grown) >= 4) deepChains++;
    const kinds = tileIdsInRegion(worldFromState(grown).sampler, 48);
    kinds.delete(EMPTY_TILE);
    if (kinds.size >= 2) paintedWorlds++;
  }
  check('free growth reaches transform chains recipes never write, at least four links deep', deepChains > ROLLS / 2);
  check('most free-grown worlds paint ground rather than an empty void', paintedWorlds > ROLLS / 2);
}

function checkWiresGrowJoints(check: CheckReporter): void {
  const base = islandsState();
  const mutated = clonedState(base);
  const applied = insertNodeIntoWire(mutated, mulberry32(13), freeTiles.all);
  check('a pipeline with live wires accepts an inserted node', applied && mutated.nodes.length === base.nodes.length + 1);
  check(
    'insertion is deterministic per stream',
    JSON.stringify(mutated) ===
      JSON.stringify(insertedOnce(base, 13)),
  );
  check(
    'an insertion survives sanitize unchanged, so the splice never leaves a dangling wire',
    JSON.stringify(sanitizePipeline(mutated)) === JSON.stringify(mutated),
  );

  const baseIds = new Set(base.nodes.map((node) => node.id));
  const inserted = mutated.nodes.find((node) => !baseIds.has(node.id));
  const consumer = mutated.nodes.find(
    (node) => inserted !== undefined && Object.values(node.inputs).includes(inserted.id),
  );
  const formerSource = formerSourceOf(base, inserted, consumer);
  check(
    'the inserted node sits inside the wire: the consumer reads it and it reads the old source',
    inserted !== undefined &&
      consumer !== undefined &&
      formerSource !== null &&
      Object.values(inserted.inputs).includes(formerSource),
  );
}

function insertedOnce(base: PipelineState, seed: number): PipelineState {
  const again = clonedState(base);
  insertNodeIntoWire(again, mulberry32(seed), freeTiles.all);
  return again;
}

function formerSourceOf(
  base: PipelineState,
  inserted: PipelineState['nodes'][number] | undefined,
  consumer: PipelineState['nodes'][number] | undefined,
): string | null {
  if (!inserted || !consumer) return null;
  const rewired = Object.entries(consumer.inputs).find(([, wired]) => wired === inserted.id);
  const twin = base.nodes.find((node) => node.id === consumer.id);
  if (!rewired || !twin) return null;
  return twin.inputs[rewired[0]] ?? null;
}

function checkSubgraphGrafts(check: CheckReporter): void {
  const head = islandsState();
  const donor = randomWorldPipeline(mulberry32(9), freeTiles);
  const child = subgraphGraftedPipeline(head, donor, mulberry32(3));
  check(
    'a graft keeps the whole head world and adds living tissue from the donor',
    child.nodes.length > head.nodes.length &&
      head.nodes.every((node, at) => child.nodes[at]!.id === node.id && child.nodes[at]!.type === node.type),
  );
  check(
    'a grafted child survives sanitize unchanged, so the transplanted wires all hold',
    JSON.stringify(sanitizePipeline(child)) === JSON.stringify(child),
  );
  check(
    'grafting is deterministic per stream',
    JSON.stringify(child) === JSON.stringify(subgraphGraftedPipeline(head, donor, mulberry32(3))),
  );
}

function checkTheFrontierWing(check: CheckReporter): void {
  const base = someScoredWorld();
  const archive = new EliteArchive();
  const champion = worldWith(base, 0.6, 0.1);
  check('a strong world is admitted as an elite', archive.admit(champion));
  const twin = worldWith(base, 0.5, 0.1);
  check('a weaker twin of an elite is turned away entirely', !archive.admit(twin) && archive.frontier().length === 0);
  const stranger = worldWith(base, 0.4, 0.5);
  check(
    'a weaker but novel world is kept on the frontier instead of discarded',
    !archive.admit(stranger) && archive.frontier().length === 1,
  );
  check(
    'frontier worlds join the breeding pool without counting as elites',
    archive.breedingPool().length === 2 && archive.all().length === 1 && archive.coverage() === 1 / 192,
  );
  const dull = worldWith(base, 0.1, 0.9);
  archive.admit(dull);
  check('a novel world below the fun floor is not worth a frontier bed', archive.frontier().length === 1);
}

function someScoredWorld(): ScoredWorld {
  for (let seed = 41; seed < 61; seed++) {
    const world = scoredGenome(rolledGenome(mulberry32(seed)), SMOKE_LIMITS, SMOKE_WALK_SEED);
    if (world) return world;
  }
  throw new Error('no walkable fixture world in twenty rolls');
}

function worldWith(world: ScoredWorld, fun: number, readingLevel: number): ScoredWorld {
  return {
    ...world,
    score: { ...world.score, overall: fun },
    fingerprint: {
      readings: world.fingerprint.readings.map(() => readingLevel),
      sceneryShares: world.fingerprint.sceneryShares,
    },
  };
}

function longestChainOf(state: PipelineState): number {
  const byId = new Map(state.nodes.map((node) => [node.id, node]));
  const depths = new Map<string, number>();
  const depthOf = (id: string): number => {
    const known = depths.get(id);
    if (known !== undefined) return known;
    const node = byId.get(id);
    if (!node) return 0;
    depths.set(id, 1);
    const parents = Object.values(node.inputs).filter((wired): wired is string => wired !== null);
    const depth = 1 + parents.reduce((deepest, parent) => Math.max(deepest, depthOf(parent)), 0);
    depths.set(id, depth);
    return depth;
  };
  return state.nodes.reduce((deepest, node) => Math.max(deepest, depthOf(node.id)), 0);
}
