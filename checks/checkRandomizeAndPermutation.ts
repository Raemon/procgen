import { nodeTypeOf } from '../procgen/nodeRegistry';
import { emptyPipeline, type PipelineState } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { mulberry32 } from '../procgen/random/mulberry32';
import { permutedNodeCombination } from '../procgen/randomize/permuteNodeCombination';
import { permutedSliderParams } from '../procgen/randomize/permuteSliderParams';
import { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import { randomWorldPipeline } from '../procgen/randomize/randomWorldPipeline';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import type { CheckReporter } from './checkReporter';
import { islandsState, tileAssets, tileIdsInRegion, worldFromState } from './pipelineWorldFixtures';

const randomizeTileIds = tileAssets.all().map((tile) => tile.id);

function paramWithinSpec(nodeType: string, name: string, value: unknown): boolean {
  const spec = nodeTypeOf(nodeType)?.params[name];
  if (!spec) return false;
  if (spec.kind === 'number' || spec.kind === 'int') {
    return typeof value === 'number' && value >= spec.min && value <= spec.max;
  }
  if (spec.kind === 'select') return typeof value === 'string' && spec.options.includes(value);
  return true;
}

function allParamsWithinSpecs(state: PipelineState): boolean {
  return state.nodes.every((node) =>
    Object.entries(node.params).every(([name, value]) => paramWithinSpec(node.type, name, value)),
  );
}

function sameStructure(a: PipelineState, b: PipelineState): boolean {
  return (
    a.nodes.length === b.nodes.length &&
    a.nodes.every(
      (node, i) =>
        node.id === b.nodes[i]!.id &&
        node.type === b.nodes[i]!.type &&
        JSON.stringify(node.inputs) === JSON.stringify(b.nodes[i]!.inputs),
    )
  );
}

export function checkRandomizeAndPermutation(check: CheckReporter): void {
  const rolledOnce = randomWorldPipeline(mulberry32(7), randomizeTileIds);
  const rolledTwice = randomWorldPipeline(mulberry32(7), randomizeTileIds);
  check('random world rolls are deterministic per stream', JSON.stringify(rolledOnce) === JSON.stringify(rolledTwice));
  check(
    'different streams roll different worlds',
    JSON.stringify(rolledOnce) !== JSON.stringify(randomWorldPipeline(mulberry32(8), randomizeTileIds)),
  );
  check(
    'random worlds survive sanitize unchanged',
    JSON.stringify(sanitizePipeline(rolledOnce)) === JSON.stringify(rolledOnce),
  );
  check('random worlds keep every param inside its declared range', allParamsWithinSpecs(rolledOnce));

  let paintedWorlds = 0;
  let sawTerrainRoll = false;
  let sawMazeRoll = false;
  const RANDOM_WORLD_ROLLS = 20;
  for (let roll = 1; roll <= RANDOM_WORLD_ROLLS; roll++) {
    const rolled = sanitizePipeline(randomWorldPipeline(mulberry32(roll * 37), randomizeTileIds));
    const kinds = tileIdsInRegion(worldFromState(rolled).sampler, 48);
    kinds.delete(EMPTY_TILE);
    if (kinds.size >= 2) paintedWorlds++;
    if (rolled.nodes.some((node) => node.type === 'mazeChunk')) sawMazeRoll = true;
    if (rolled.nodes.some((node) => node.type === 'thresholdTiles')) sawTerrainRoll = true;
  }
  check('random worlds cover both terrain and maze recipes', sawTerrainRoll && sawMazeRoll);

  const sliderBase = islandsState();
  const sliderShuffled = permutedSliderParams(sliderBase, mulberry32(5));
  check(
    'slider permutation is deterministic per stream',
    JSON.stringify(sliderShuffled) === JSON.stringify(permutedSliderParams(sliderBase, mulberry32(5))),
  );
  check('slider permutation preserves nodes and wiring', sameStructure(sliderBase, sliderShuffled));
  check('slider permutation keeps params inside their declared ranges', allParamsWithinSpecs(sliderShuffled));
  check(
    'slider permutation moves at least one slider',
    JSON.stringify(sliderShuffled.nodes.map((node) => node.params)) !==
      JSON.stringify(sliderBase.nodes.map((node) => node.params)),
  );
  check(
    'slider permutation leaves tiles and text params alone',
    sliderShuffled.nodes[1]!.params.belowTile === sliderBase.nodes[1]!.params.belowTile &&
      sliderShuffled.nodes[1]!.params.aboveTile === sliderBase.nodes[1]!.params.aboveTile &&
      sliderShuffled.nodes[4]!.params.tag === sliderBase.nodes[4]!.params.tag,
  );
  check(
    'slider permutation does not mutate its input state',
    JSON.stringify(sliderBase) === JSON.stringify(islandsState()),
  );

  const comboBase = islandsState();
  const comboShuffled = permutedNodeCombination(comboBase, mulberry32(5), randomizeTileIds);
  check(
    'node permutation is deterministic per stream',
    JSON.stringify(comboShuffled) ===
      JSON.stringify(permutedNodeCombination(comboBase, mulberry32(5), randomizeTileIds)),
  );
  check('node permutation changes the combination', !sameStructure(comboBase, comboShuffled));
  check(
    'node permutation yields a pipeline that survives sanitize unchanged',
    JSON.stringify(sanitizePipeline(comboShuffled)) === JSON.stringify(comboShuffled),
  );
  check(
    'node permutation of an empty pipeline rolls fresh nodes',
    permutedNodeCombination(emptyPipeline(), mulberry32(3), randomizeTileIds).nodes.length > 0,
  );
  let comboWorks = true;
  for (let roll = 1; roll <= 8; roll++) {
    const mutated = permutedNodeCombination(islandsState(), mulberry32(roll * 31), randomizeTileIds);
    if (JSON.stringify(sanitizePipeline(mutated)) !== JSON.stringify(mutated)) comboWorks = false;
    worldFromState(mutated).sampler.tileAt(5, 5);
  }
  check('repeated node permutations stay valid and generate without crashing', comboWorks);

  const historyStates = new RandomizeHistory();
  check('randomize history starts empty', !historyStates.canUndo() && historyStates.undo() === null);
  historyStates.remember(islandsState());
  const rememberedThenMutated = islandsState();
  historyStates.remember(rememberedThenMutated);
  rememberedThenMutated.nodes[0]!.params.scale = 0.29;
  const restored = historyStates.undo();
  check(
    'randomize history restores snapshots untouched by later edits',
    restored !== null && restored.nodes[0]!.params.scale !== 0.29 && historyStates.canUndo(),
  );
}
