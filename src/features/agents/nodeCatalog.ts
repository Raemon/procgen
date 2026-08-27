import { allNodeTypes, nodeTypeOf } from '@/features/asset-library/worlds/nodeRegistry';
import {
  defaultParams,
  outputKindOf,
  outputSemanticOf,
  type NodeTypeDef,
  type ParamSpec,
} from '@/features/asset-library/worlds/nodeType';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import type { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';

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
    knob_note:
      'every param value is a number except pointKey knobs and custom-script select/code params, which are strings',
    semantic_note:
      'output_semantic and an input\'s expects say what the numbers in a field MEAN — unit, elevation, mask, cost, years, distance or raw. They never make a wire invalid; they only tell you when a field is being read as something it is not.',
    point_note:
      'point_attributes lists the named numbers a points node writes into every point it emits, and an input\'s requires_point_attributes lists the ones that input reads. A node listing neither promises nothing either way, so nothing is warned about.',
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
    output_semantic: outputSemanticOf(def, defaultParams(def)) ?? null,
    point_attributes: def.pointAttributes ?? null,
    params: Object.fromEntries(
      Object.entries(def.params).map(([name, spec]) => [name, paramSpecJson(spec)]),
    ),
    inputs: Object.fromEntries(
      Object.entries(def.inputs).map(([name, spec]) => [
        name,
        {
          kind: spec.kind,
          label: spec.label,
          help: spec.help,
          optional: spec.optional ?? false,
          expects: spec.expects ?? null,
          requires_point_attributes: spec.requiresPointAttributes ?? null,
        },
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
  if (spec.kind === 'pointKey') {
    return { kind: spec.kind, label: spec.label, help: spec.help, default: spec.default, from: spec.from };
  }
  if (spec.kind === 'select') {
    return { kind: spec.kind, label: spec.label, help: spec.help, default: spec.default, options: spec.options, option_help: spec.optionHelp };
  }
  return { kind: spec.kind, label: spec.label, help: spec.help, default: spec.default };
}
