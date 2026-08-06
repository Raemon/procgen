import { allNodeTypes, nodeTypeOf } from '../procgen/nodeRegistry';
import { outputKindOf, type NodeTypeDef, type ParamSpec } from '../procgen/nodeType';
import type { NodeInstance } from '../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../procgen/pipeline/pipelineStore';

export function pipelineJson(store: PipelineStore) {
  return {
    seed: store.seed(),
    node_order_note: 'nodes run top to bottom; a node may only consume earlier nodes',
    nodes: store.nodes().map(pipelineNodeJson),
  };
}

function pipelineNodeJson(node: NodeInstance, position: number) {
  const def = nodeTypeOf(node.type);
  return {
    position,
    id: node.id,
    type: node.type,
    label: node.label,
    comment: node.comment,
    enabled: node.enabled,
    output: def ? outputKindOf(def, node.params) : 'unknown',
    display: node.display,
    params: node.params,
    inputs: node.inputs,
  };
}

export function nodeTypesJson() {
  return {
    knob_note: 'every param value is a number except custom-script select/code params',
    types: allNodeTypes().map(nodeTypeJson),
  };
}

function nodeTypeJson(def: NodeTypeDef) {
  return {
    type: def.type,
    title: def.title,
    category: def.category,
    description: def.description,
    when_to_use: def.whenToUse,
    output: typeof def.output === 'function' ? 'depends on params' : def.output,
    params: Object.fromEntries(
      Object.entries(def.params).map(([name, spec]) => [name, paramSpecJson(spec)]),
    ),
    inputs: Object.fromEntries(
      Object.entries(def.inputs).map(([name, spec]) => [
        name,
        { kind: spec.kind, label: spec.label, help: spec.help, optional: spec.optional ?? false },
      ]),
    ),
  };
}

function paramSpecJson(spec: ParamSpec) {
  if (spec.kind === 'number' || spec.kind === 'int') {
    return { kind: spec.kind, label: spec.label, help: spec.help, min: spec.min, max: spec.max, default: spec.default };
  }
  if (spec.kind === 'choice') {
    return {
      kind: spec.kind,
      label: spec.label,
      help: spec.help,
      default: spec.default,
      options: spec.options.map((option) => ({ value: option.value, label: option.label, help: option.help })),
    };
  }
  if (spec.kind === 'toggle') return { kind: spec.kind, label: spec.label, help: spec.help, default: spec.default };
  if (spec.kind === 'tile') return { kind: spec.kind, label: spec.label, help: spec.help };
  if (spec.kind === 'select') {
    return { kind: spec.kind, label: spec.label, help: spec.help, default: spec.default, options: spec.options, option_help: spec.optionHelp };
  }
  return { kind: spec.kind, label: spec.label, help: spec.help, default: spec.default };
}
