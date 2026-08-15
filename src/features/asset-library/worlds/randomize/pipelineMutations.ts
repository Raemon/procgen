import type { RandomStream } from '../random/mulberry32';
import { defaultBindingForKind, isBindingValidForKind } from '../display/displayBinding';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type NodeTypeDef } from '../nodeType';
import type { ValueKind } from '../values/chunkValues';
import { nextNodeId } from '../pipeline/createNodeInstance';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import { randomMarkerDisplay } from './markerPalette';
import { defaultOutputKindOf, randomizableNodeTypes, sameKindAlternatives } from './nodeTypePools';
import { randomParams } from './randomNodeParams';
import { chance, pick, rollBetween, rollInt, shuffled, snappedToStep } from './randomRolls';
import {
  inputCandidatesBeforeIndex,
  randomWireFor,
  requiredInputsSatisfiable,
  wireRandomInputs,
} from './randomWiring';
import { recipeNode } from './recipeNode';

export type PipelineMutation = (
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
) => boolean;

export const PIPELINE_MUTATIONS: readonly PipelineMutation[] = [
  swapRandomNodeType,
  addRandomNode,
  insertNodeIntoWire,
  removeRandomNode,
  rewireRandomInput,
];

function swapRandomNodeType(
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
): boolean {
  for (const index of shuffled(rng, state.nodes.map((_, i) => i))) {
    const def = nodeTypeOf(state.nodes[index]!.type);
    if (!def) continue;
    const alternatives = sameKindAlternatives(def).filter((alt) =>
      requiredInputsSatisfiable(state, index, alt),
    );
    if (alternatives.length === 0) continue;
    replaceNodeWithType(state, index, pick(rng, alternatives), rng, tileIds);
    return true;
  }
  return false;
}

function replaceNodeWithType(
  state: PipelineState,
  index: number,
  def: NodeTypeDef,
  rng: RandomStream,
  tileIds: readonly number[],
): void {
  const previous = state.nodes[index]!;
  const node = recipeNode({ id: previous.id, type: def.type, label: def.title });
  node.params = randomParams(def, rng, tileIds);
  wireRandomInputs(state, index, node, def, rng);
  node.display = isBindingValidForKind(previous.display, defaultOutputKindOf(def))
    ? previous.display
    : defaultBindingForKind(defaultOutputKindOf(def));
  state.nodes[index] = node;
}

export function addRandomNode(
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
): boolean {
  const index = state.nodes.length;
  const pool = randomizableNodeTypes().filter((def) => requiredInputsSatisfiable(state, index, def));
  if (pool.length === 0) return false;
  state.nodes.push(builtRandomNode(state, pick(rng, pool), rng, tileIds));
  return true;
}

function builtRandomNode(
  state: PipelineState,
  def: NodeTypeDef,
  rng: RandomStream,
  tileIds: readonly number[],
): NodeInstance {
  const node = recipeNode({ id: nextNodeId(state), type: def.type, label: def.title });
  node.params = randomParams(def, rng, tileIds);
  wireRandomInputs(state, state.nodes.length, node, def, rng);
  applyRandomDisplay(node, def, rng, tileIds);
  return node;
}

function applyRandomDisplay(
  node: NodeInstance,
  def: NodeTypeDef,
  rng: RandomStream,
  tileIds: readonly number[],
): void {
  const kind = defaultOutputKindOf(def);
  if (kind === 'points') node.display = randomMarkerDisplay(rng, tileIds);
  if (kind === 'field' && chance(rng, 0.5)) {
    node.display = { mode: 'elevation', heightScale: snappedToStep(rollBetween(rng, 1, 5), 0.5, 8, 0.5) };
  }
}

export function insertNodeIntoWire(
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
): boolean {
  for (const wire of shuffled(rng, liveWiresOf(state))) {
    const insertable = insertableTypesFor(state, wire);
    if (insertable.length === 0) continue;
    spliceNodeIntoWire(state, wire, pick(rng, insertable), rng, tileIds);
    return true;
  }
  return false;
}

interface LiveWire {
  consumerIndex: number;
  inputName: string;
  sourceId: string;
  kind: ValueKind;
}

function liveWiresOf(state: PipelineState): LiveWire[] {
  const wires: LiveWire[] = [];
  state.nodes.forEach((node, consumerIndex) => {
    const def = nodeTypeOf(node.type);
    if (!def) return;
    for (const inputName of Object.keys(def.inputs)) {
      const sourceId = node.inputs[inputName];
      const kind = sourceId ? outputKindOfNodeId(state, sourceId) : null;
      if (sourceId && kind) wires.push({ consumerIndex, inputName, sourceId, kind });
    }
  });
  return wires;
}

function outputKindOfNodeId(state: PipelineState, nodeId: string): ValueKind | null {
  const source = state.nodes.find((node) => node.id === nodeId);
  const def = source ? nodeTypeOf(source.type) : undefined;
  return source && def ? outputKindOf(def, source.params) : null;
}

function insertableTypesFor(state: PipelineState, wire: LiveWire): NodeTypeDef[] {
  return randomizableNodeTypes().filter(
    (def) =>
      defaultOutputKindOf(def) === wire.kind &&
      carrierInputOf(def, wire.kind) !== null &&
      requiredInputsSatisfiable(state, wire.consumerIndex, def),
  );
}

function carrierInputOf(def: NodeTypeDef, kind: ValueKind): string | null {
  const carrier = Object.entries(def.inputs).find(
    ([, spec]) => spec.kind === kind || spec.kind === 'any',
  );
  return carrier ? carrier[0] : null;
}

function spliceNodeIntoWire(
  state: PipelineState,
  wire: LiveWire,
  def: NodeTypeDef,
  rng: RandomStream,
  tileIds: readonly number[],
): void {
  const consumer = state.nodes[wire.consumerIndex]!;
  const node = recipeNode({ id: nextNodeId(state), type: def.type, label: def.title });
  node.params = randomParams(def, rng, tileIds);
  for (const [name, spec] of Object.entries(def.inputs)) {
    node.inputs[name] =
      name === carrierInputOf(def, wire.kind)
        ? wire.sourceId
        : randomWireFor(state, wire.consumerIndex, spec, rng);
  }
  state.nodes.splice(wire.consumerIndex, 0, node);
  consumer.inputs[wire.inputName] = node.id;
}

function removeRandomNode(state: PipelineState, rng: RandomStream): boolean {
  if (state.nodes.length < 2) return false;
  const index = rollInt(rng, 0, state.nodes.length - 1);
  const [removed] = state.nodes.splice(index, 1);
  reconnectConsumersOf(state, removed!.id, rng);
  return true;
}

function reconnectConsumersOf(state: PipelineState, removedId: string, rng: RandomStream): void {
  state.nodes.forEach((node, index) => {
    const def = nodeTypeOf(node.type);
    if (!def) return;
    for (const [name, spec] of Object.entries(def.inputs)) {
      if (node.inputs[name] === removedId) node.inputs[name] = randomWireFor(state, index, spec, rng);
    }
  });
}

function rewireRandomInput(state: PipelineState, rng: RandomStream): boolean {
  const rewireable = collectRewireableInputs(state);
  if (rewireable.length === 0) return false;
  const target = pick(rng, rewireable);
  target.node.inputs[target.name] = pick(rng, target.choices).id;
  return true;
}

interface RewireableInput {
  node: NodeInstance;
  name: string;
  choices: NodeInstance[];
}

function collectRewireableInputs(state: PipelineState): RewireableInput[] {
  const found: RewireableInput[] = [];
  state.nodes.forEach((node, index) => {
    const def = nodeTypeOf(node.type);
    if (def) found.push(...rewireableInputsOf(state, node, index, def));
  });
  return found;
}

function rewireableInputsOf(
  state: PipelineState,
  node: NodeInstance,
  index: number,
  def: NodeTypeDef,
): RewireableInput[] {
  return Object.entries(def.inputs)
    .map(([name, spec]) => ({
      node,
      name,
      choices: inputCandidatesBeforeIndex(state, index, spec).filter(
        (source) => source.id !== node.inputs[name],
      ),
    }))
    .filter((candidate) => candidate.choices.length > 0);
}
