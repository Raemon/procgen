import type { InputSpec, NodeTypeDef } from '../nodeType';
import type { NodeInstance, PipelineState } from './pipelineState';
import { wiringCandidates } from './wiringRules';

export function autoWireInputsToNearestSources(
  state: PipelineState,
  node: NodeInstance,
  def: NodeTypeDef,
): void {
  const claimed = new Set<string>();
  for (const [name, spec] of Object.entries(def.inputs)) {
    if (spec.optional) continue;
    const source = nearestUnclaimedSource(state, node.id, spec, claimed);
    if (!source) continue;
    node.inputs[name] = source.id;
    claimed.add(source.id);
  }
}

function nearestUnclaimedSource(
  state: PipelineState,
  nodeId: string,
  spec: InputSpec,
  claimed: Set<string>,
): NodeInstance | null {
  const candidates = wiringCandidates(state, nodeId, spec);
  const nearestFirst = [...candidates].reverse();
  return nearestFirst.find((source) => !claimed.has(source.id)) ?? nearestFirst[0] ?? null;
}
