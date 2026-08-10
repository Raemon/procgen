import { nodeTypeOf } from '../nodeRegistry';
import { hashString } from '../random/hashString';
import type { PipelineState } from './pipelineState';

export function computeNodeSignatures(state: PipelineState): Map<string, string> {
  const signatures = new Map<string, string>();
  for (const node of state.nodes) {
    const wiredSignatures = Object.entries(node.inputs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, sourceId]) => `${name}=${sourceId ? (signatures.get(sourceId) ?? 'missing') : 'none'}`);
    signatures.set(node.id, signatureOf(state.seed, timeReadBy(node, state.time), node, wiredSignatures));
  }
  return signatures;
}

function timeReadBy(node: { type: string }, time: number): number | null {
  return nodeTypeOf(node.type)?.readsTime ? time : null;
}

function signatureOf(
  seed: number,
  time: number | null,
  node: { type: string; enabled: boolean; params: Record<string, unknown> },
  wiredSignatures: string[],
): string {
  const paramsInStableOrder = Object.entries(node.params).sort(([a], [b]) => a.localeCompare(b));
  const content = JSON.stringify([seed, time, node.type, node.enabled, paramsInStableOrder, wiredSignatures]);
  return hashString(content).toString(36) + hashString(`salt:${content}`).toString(36);
}
