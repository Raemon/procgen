import type { RandomStream } from '../random/mulberry32';
import type { InputSpec, NodeTypeDef } from '../nodeType';
import { nextNodeId } from '../pipeline/createNodeInstance';
import { DEFAULT_DAYLIGHT, type NodeInstance, type PipelineState } from '../pipeline/pipelineState';
import { dropInvalidWires } from '../pipeline/wiringRules';
import { PRESENT } from '../time/worldTime';
import { defaultOutputKindOf, randomizableNodeTypes } from './nodeTypePools';
import { addRandomNode } from './pipelineMutations';
import { randomParams } from './randomNodeParams';
import { chance, pick, rollBetween, rollInt, snappedToStep } from './randomRolls';
import { requiredInputsSatisfiable, wireRandomInputs } from './randomWiring';
import { recipeNode } from './recipeNode';
import type { RecipeTiles } from './recipeTiles';
import { appendBandLayers } from './terrainRecipe';

const SHORTEST_CHAIN = 3;
const LONGEST_CHAIN = 7;
const FEWEST_WILD_NODES = 2;
const MOST_WILD_NODES = 6;

export function freeGrownPipeline(rng: RandomStream, tiles: RecipeTiles): PipelineState {
  const state: PipelineState = {
    seed: rollInt(rng, 1, 999_999),
    daylight: DEFAULT_DAYLIGHT,
    time: PRESENT,
    nodes: [],
  };
  const chain = growFieldChain(state, rng, tiles.all);
  const canvasId = appendCanvas(state, rng, chain);
  appendBandLayers(state.nodes, rng, tiles, canvasId);
  growWildNodes(state, rng, tiles.all);
  dropInvalidWires(state);
  return state;
}

interface GrownChain {
  rootId: string;
  tipId: string;
}

function growFieldChain(state: PipelineState, rng: RandomStream, tileIds: readonly number[]): GrownChain {
  const root = grownNode(state, pick(rng, fieldSourceTypes()), rng, tileIds);
  state.nodes.push(root);
  let tip = root;
  const wanted = rollInt(rng, SHORTEST_CHAIN, LONGEST_CHAIN);
  for (let link = 1; link < wanted; link++) {
    const transforms = fieldTransformTypesFor(state);
    if (transforms.length === 0) break;
    const def = pick(rng, transforms);
    const node = grownNode(state, def, rng, tileIds);
    wireCarrierToTip(node, def, tip.id);
    state.nodes.push(node);
    tip = node;
  }
  return { rootId: root.id, tipId: tip.id };
}

function appendCanvas(state: PipelineState, rng: RandomStream, chain: GrownChain): string {
  const canvas =
    chain.tipId === chain.rootId
      ? state.nodes.find((node) => node.id === chain.rootId)!
      : blendedCanvasNode(state, rng, chain);
  if (canvas.id !== chain.rootId) state.nodes.push(canvas);
  if (chance(rng, 0.7)) {
    canvas.display = {
      mode: 'elevation',
      heightScale: snappedToStep(rollBetween(rng, 2, 7), 0.5, 8, 0.5),
    };
  }
  return canvas.id;
}

function blendedCanvasNode(
  state: PipelineState,
  rng: RandomStream,
  chain: GrownChain,
): NodeInstance {
  const node = recipeNode({ id: nextNodeId(state), type: 'blendFields', label: 'canvas' });
  node.params.weight = snappedToStep(rollBetween(rng, 0.25, 0.45), 0, 1, 0.01);
  node.inputs.a = chain.rootId;
  node.inputs.b = chain.tipId;
  return node;
}

function grownNode(
  state: PipelineState,
  def: NodeTypeDef,
  rng: RandomStream,
  tileIds: readonly number[],
): NodeInstance {
  const node = recipeNode({ id: nextNodeId(state), type: def.type, label: def.title });
  node.params = randomParams(def, rng, tileIds);
  wireRandomInputs(state, state.nodes.length, node, def, rng);
  return node;
}

function wireCarrierToTip(node: NodeInstance, def: NodeTypeDef, tipId: string): void {
  const carrier = Object.entries(def.inputs).find(([, spec]) => carriesFields(spec));
  if (carrier) node.inputs[carrier[0]] = tipId;
}

function carriesFields(spec: InputSpec): boolean {
  return spec.kind === 'field' || spec.kind === 'any';
}

const SPREAD_SOURCES = new Set(['noiseField', 'terrainNoise']);

function fieldSourceTypes(): NodeTypeDef[] {
  return randomizableNodeTypes().filter((def) => SPREAD_SOURCES.has(def.type));
}

function fieldTransformTypesFor(state: PipelineState): NodeTypeDef[] {
  return randomizableNodeTypes().filter(
    (def) =>
      defaultOutputKindOf(def) === 'field' &&
      Object.values(def.inputs).some(carriesFields) &&
      requiredInputsSatisfiable(state, state.nodes.length, def),
  );
}

function growWildNodes(state: PipelineState, rng: RandomStream, tileIds: readonly number[]): void {
  const wanted = rollInt(rng, FEWEST_WILD_NODES, MOST_WILD_NODES);
  for (let grown = 0; grown < wanted; grown++) addRandomNode(state, rng, tileIds);
}
