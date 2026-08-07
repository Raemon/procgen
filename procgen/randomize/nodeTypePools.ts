import { allNodeTypes } from '../nodeRegistry';
import { defaultParams, outputKindOf, type NodeTypeDef } from '../nodeType';
import type { ValueKind } from '../values/chunkValues';

const EXCLUDED_FROM_RANDOM = new Set(['customScript']);

export function randomizableNodeTypes(): NodeTypeDef[] {
  return allNodeTypes().filter((def) => !EXCLUDED_FROM_RANDOM.has(def.type));
}

export function defaultOutputKindOf(def: NodeTypeDef): ValueKind {
  return outputKindOf(def, defaultParams(def));
}

export function sameKindAlternatives(def: NodeTypeDef): NodeTypeDef[] {
  return randomizableNodeTypes().filter(
    (candidate) =>
      candidate.type !== def.type && defaultOutputKindOf(candidate) === defaultOutputKindOf(def),
  );
}
