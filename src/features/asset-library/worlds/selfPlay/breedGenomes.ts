import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { RandomStream } from '../random/mulberry32';
import { clonedState } from '../randomize/clonedState';
import { chance, clamped, pick, rollInt } from '../randomize/randomRolls';
import {
  LARGEST_PALETTE,
  SMALLEST_PALETTE,
  type WorldGenome,
} from './worldGenome';

export function bredGenome(
  one: WorldGenome,
  other: WorldGenome,
  rng: RandomStream,
): WorldGenome {
  const paletteParent = chance(rng, 0.5) ? one : other;
  return {
    kitSeed: paletteParent.kitSeed,
    accentKitSeed: paletteParent.accentKitSeed,
    paletteSize: inheritedPaletteSize(one, other, rng),
    pipeline: splicedPipeline(one.pipeline, other.pipeline, rng),
  };
}

function inheritedPaletteSize(one: WorldGenome, other: WorldGenome, rng: RandomStream): number {
  const blended = chance(rng, 0.5)
    ? Math.round((one.paletteSize + other.paletteSize) / 2)
    : (chance(rng, 0.5) ? one : other).paletteSize;
  return clamped(blended, SMALLEST_PALETTE, LARGEST_PALETTE);
}

const SUBGRAPH_GRAFT_SHARE = 0.4;

function splicedPipeline(
  head: PipelineState,
  tail: PipelineState,
  rng: RandomStream,
): PipelineState {
  if (chance(rng, SUBGRAPH_GRAFT_SHARE)) return subgraphGraftedPipeline(head, tail, rng);
  const child = clonedState(head);
  const keptHead = child.nodes.slice(0, cutPointOf(child.nodes, rng));
  const graft = graftedTailOf(tail, highestNumericIdOf(keptHead), rng);
  child.nodes = [...keptHead, ...graft];
  return sanitizePipeline(child);
}

export function subgraphGraftedPipeline(
  head: PipelineState,
  donor: PipelineState,
  rng: RandomStream,
): PipelineState {
  const child = clonedState(head);
  const graft = graftedSubgraphOf(donor, highestNumericIdOf(child.nodes), rng);
  child.nodes = [...child.nodes, ...graft];
  return sanitizePipeline(child);
}

function graftedSubgraphOf(
  donor: PipelineState,
  idsTaken: number,
  rng: RandomStream,
): NodeInstance[] {
  const source = clonedState(donor);
  if (source.nodes.length === 0) return [];
  const root = pickGraftRoot(source.nodes, rng);
  const closure = ancestorClosureOf(source.nodes, root);
  const grafted = source.nodes.filter((node) => closure.has(node.id));
  const freshIds = new Map(grafted.map((node, at) => [node.id, `n${idsTaken + at + 1}`]));
  for (const node of grafted) {
    node.id = freshIds.get(node.id)!;
    for (const [name, wired] of Object.entries(node.inputs)) {
      node.inputs[name] = wired === null ? null : (freshIds.get(wired) ?? null);
    }
  }
  return grafted;
}

function pickGraftRoot(nodes: readonly NodeInstance[], rng: RandomStream): NodeInstance {
  const visible = nodes.filter((node) => node.display.mode !== 'hidden');
  return pick(rng, visible.length > 0 ? visible : nodes);
}

function ancestorClosureOf(nodes: readonly NodeInstance[], root: NodeInstance): Set<string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const closure = new Set<string>();
  const frontier = [root];
  while (frontier.length > 0) {
    const node = frontier.pop()!;
    if (closure.has(node.id)) continue;
    closure.add(node.id);
    for (const wired of Object.values(node.inputs)) {
      const parent = wired === null ? undefined : byId.get(wired);
      if (parent) frontier.push(parent);
    }
  }
  return closure;
}

function highestNumericIdOf(nodes: readonly NodeInstance[]): number {
  return nodes.reduce((highest, node) => {
    const digits = Number(node.id.replace(/\D/g, ''));
    return Number.isFinite(digits) ? Math.max(highest, digits) : highest;
  }, 0);
}

function cutPointOf(nodes: readonly NodeInstance[], rng: RandomStream): number {
  if (nodes.length === 0) return 0;
  return rollInt(rng, 1, nodes.length);
}

function graftedTailOf(
  tail: PipelineState,
  idsTaken: number,
  rng: RandomStream,
): NodeInstance[] {
  const donor = clonedState(tail);
  const from = donor.nodes.length === 0 ? 0 : rollInt(rng, 0, donor.nodes.length - 1);
  const grafted = donor.nodes.slice(from);
  const freshIds = new Map(grafted.map((node, at) => [node.id, `n${idsTaken + at + 1}`]));
  for (const node of grafted) {
    node.id = freshIds.get(node.id)!;
    for (const [name, wired] of Object.entries(node.inputs)) {
      node.inputs[name] = wired === null ? null : (freshIds.get(wired) ?? null);
    }
  }
  return grafted;
}
