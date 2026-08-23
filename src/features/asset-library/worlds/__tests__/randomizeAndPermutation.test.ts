import '../nodes';
import { nodeTypeOf } from '../nodeRegistry';
import { emptyPipeline, type PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { mulberry32 } from '../random/mulberry32';
import { permutedNodeCombination } from '../randomize/permuteNodeCombination';
import { permutedSliderParams } from '../randomize/permuteSliderParams';
import { PLAYABLE_PACES, rolledUntilPlayable, spawnPacesOf } from '../randomize/playableRoll';
import { RandomizeHistory } from '../randomize/randomizeHistory';
import { randomWorldPipeline } from '../randomize/randomWorldPipeline';
import { NO_CULTURES, NO_PIECES } from '../structureOverlay/structureOverlay';
import { EMPTY_TILE } from '../values/chunkValues';
import { walkableCellsFrom } from '../walkingSim/spawnCell';
import { flatStepProbe } from '../walkingSim/worldProbes';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { islandsState, tileIdsInRegion, worldFromState } from './pipelineWorldFixtures';
import { recipeTilesOf } from '../randomize/recipeTiles';
import { fixtureTileAssets, openPlainState, WALL_TILE } from './walkingSimFixtures';

const randomizeTileIds = recipeTilesOf(fixtureTileAssets.all());

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

function walledState(): PipelineState {
  return sanitizePipeline({
    seed: 9,
    nodes: [
      {
        id: 'n1',
        type: 'constantField',
        label: 'flat',
        enabled: true,
        params: { value: 1 },
        inputs: {},
      },
      {
        id: 'n2',
        type: 'thresholdTiles',
        label: 'walls everywhere',
        enabled: true,
        params: { threshold: 0.5, belowTile: WALL_TILE, aboveTile: WALL_TILE },
        inputs: { source: 'n1' },
      },
    ],
  });
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
  const recipeSignatures = new Set<string>();
  const RANDOM_WORLD_ROLLS = 40;
  for (let roll = 1; roll <= RANDOM_WORLD_ROLLS; roll++) {
    const rolled = sanitizePipeline(randomWorldPipeline(mulberry32(roll * 37), randomizeTileIds));
    const kinds = tileIdsInRegion(worldFromState(rolled).sampler, 48);
    kinds.delete(EMPTY_TILE);
    if (kinds.size >= 2) paintedWorlds++;
    for (const node of rolled.nodes) recipeSignatures.add(node.type);
  }
  check(
    'random worlds cover the terrain, maze, riverlands and volcanic recipes',
    ['thresholdTiles', 'mazeChunk', 'riverFromFlow', 'volcanoConeField'].every((signature) =>
      recipeSignatures.has(signature),
    ),
  );
  check(
    'random worlds roll the composition vocabulary: terraces, region plans and strait bridges',
    ['terraceField', 'regionPlan', 'straitBridges'].every((signature) =>
      recipeSignatures.has(signature),
    ),
  );
  check('most random rolls paint a world rather than an empty void', paintedWorlds > RANDOM_WORLD_ROLLS / 2);

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

  const spawnAssets = { tileAssets: fixtureTileAssets, pieces: NO_PIECES, cultures: NO_CULTURES };
  const corridor = flatStepProbe((x, y) => y === 0 && x >= 0 && x < 30);
  check(
    'walkable cells are counted out to the room there is',
    walkableCellsFrom({ x: 0, y: 0 }, corridor, 300) === 30,
  );
  const capped = walkableCellsFrom({ x: 0, y: 0 }, corridor, 10);
  check('counting walkable cells stops near the asked-for cap', capped >= 10 && capped < 30);
  check(
    'an open plain spawns the player with the playable paces',
    spawnPacesOf(openPlainState(), spawnAssets, { x: 0, y: 0 }) >= PLAYABLE_PACES,
  );
  check(
    'a sealed world spawns the player with nowhere to walk',
    spawnPacesOf(walledState(), spawnAssets, { x: 0, y: 0 }) === 0,
  );

  const paceBySeed = new Map([
    [1, 4],
    [2, 40],
    [3, PLAYABLE_PACES],
    [4, 999],
  ]);
  let dealt = 0;
  const playable = rolledUntilPlayable(
    (seed) => ({ ...emptyPipeline(), seed }),
    (state) => paceBySeed.get(state.seed) ?? 0,
    () => ++dealt,
  );
  check(
    'rolling stops at the first world with paces enough to play',
    playable.seed === 3 && playable.rolls === 3 && playable.paces === PLAYABLE_PACES,
  );
  let dealtShort = 0;
  const roomiest = rolledUntilPlayable(
    (seed) => ({ ...emptyPipeline(), seed }),
    (state) => (state.seed === 5 ? 60 : 10),
    () => ++dealtShort,
  );
  check(
    'when no roll is playable the roomiest attempt is kept',
    roomiest.seed === 5 && roomiest.paces === 60 && roomiest.rolls > 5,
  );

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
