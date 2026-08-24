import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { RandomStream } from '../random/mulberry32';
import { clonedState } from '../randomize/clonedState';
import { chance, clamped, rollInt } from '../randomize/randomRolls';
import {
  LARGEST_PALETTE,
  SMALLEST_PALETTE,
  type WorldSeedGenome,
} from './worldSeedGenome';

export function bredGenome(
  one: WorldSeedGenome,
  other: WorldSeedGenome,
  rng: RandomStream,
): WorldSeedGenome {
  const paletteParent = chance(rng, 0.5) ? one : other;
  return {
    kitSeed: paletteParent.kitSeed,
    accentKitSeed: paletteParent.accentKitSeed,
    paletteSize: inheritedPaletteSize(one, other, rng),
    pipeline: splicedPipeline(one.pipeline, other.pipeline, rng),
  };
}

function inheritedPaletteSize(one: WorldSeedGenome, other: WorldSeedGenome, rng: RandomStream): number {
  const blended = chance(rng, 0.5)
    ? Math.round((one.paletteSize + other.paletteSize) / 2)
    : (chance(rng, 0.5) ? one : other).paletteSize;
  return clamped(blended, SMALLEST_PALETTE, LARGEST_PALETTE);
}

function splicedPipeline(
  head: PipelineState,
  tail: PipelineState,
  rng: RandomStream,
): PipelineState {
  const child = clonedState(head);
  const keptHead = child.nodes.slice(0, cutPointOf(child.nodes, rng));
  const graft = graftedTailOf(tail, highestNumericIdOf(keptHead), rng);
  child.nodes = [...keptHead, ...graft];
  return sanitizePipeline(child);
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
