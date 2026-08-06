import { nodeTypeOf } from '../procgen/nodeRegistry';
import { isKnobParamSpec } from '../procgen/nodeType';
import type { NodeInstance } from '../procgen/pipeline/pipelineState';

export interface SteerableKnob {
  nodeId: string;
  param: string;
  value: number;
  min: number;
  max: number;
  isInteger: boolean;
}

export function steerableKnobsOf(nodes: readonly NodeInstance[]): SteerableKnob[] {
  return nodes.filter((node) => node.enabled).flatMap(knobsOfNode);
}

export function knobRange(knob: SteerableKnob): number {
  return knob.max - knob.min;
}

export function knobWithFractionAdded(knob: SteerableKnob, fraction: number): number {
  const raw = knob.value + fraction * knobRange(knob);
  const clamped = Math.min(knob.max, Math.max(knob.min, raw));
  return knob.isInteger ? Math.round(clamped) : clamped;
}

function knobsOfNode(node: NodeInstance): SteerableKnob[] {
  const def = nodeTypeOf(node.type);
  if (!def) return [];
  return Object.entries(def.params).flatMap(([param, spec]) => {
    if (!isKnobParamSpec(spec) || (spec.kind !== 'number' && spec.kind !== 'int')) return [];
    const value = node.params[param];
    if (typeof value !== 'number') return [];
    return [{ nodeId: node.id, param, value, min: spec.min, max: spec.max, isInteger: spec.kind === 'int' }];
  });
}
