import { hashString } from '../random/hashString';
import type { PipelineState } from './pipelineState';

export type ReadsTime = (nodeType: string) => boolean;

export function computeNodeSignatures(
  state: PipelineState,
  readsTime: ReadsTime,
): Map<string, string> {
  const signatures = new Map<string, string>();
  for (const node of state.nodes) {
    const wiredSignatures = Object.entries(node.inputs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, sourceId]) => `${name}=${sourceId ? (signatures.get(sourceId) ?? 'missing') : 'none'}`);
    const time = readsTime(node.type) ? state.time : null;
    signatures.set(node.id, signatureOf(state.seed, time, node, wiredSignatures));
  }
  return signatures;
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
