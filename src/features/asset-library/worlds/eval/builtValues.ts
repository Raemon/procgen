import { nodeTypeOf } from '../nodeRegistry';
import type { ParamValue, WholeWorldSpec } from '../nodeType';
import type { NodeInstance } from '../pipeline/pipelineState';
import { hashString } from '../random/hashString';

export interface BuildRequest {
  nodeType: string;
  seed: number;
  params: Record<string, ParamValue>;
}

export type BuildState = 'queued' | 'building' | 'ready' | 'failed';

export interface BuildProgress {
  key: string;
  nodeType: string;
  state: BuildState;
  fraction: number;
  stage: string;
  elapsedMs: number;
  estimatedMs: number;
  error: string | null;
}

export interface BuiltValueSource {
  valueOf(request: BuildRequest): unknown | null;
  progressOf(request: BuildRequest): BuildProgress | null;
  onChange(listener: () => void): () => void;
}

export interface WorldBuilds extends BuiltValueSource {
  request(request: BuildRequest): BuildProgress;
  statusOf(key: string): BuildProgress | null;
  serializedOf(key: string): unknown | null;
  summary(): BuildSummary;
}

export interface BuildSummary {
  queued: number;
  building: number;
  ready: number;
  failed: number;
}

export type ProgressReport = (fraction: number, stage: string) => void;

const READY_BUILDS_KEPT = 8;

export function buildKeyOf(request: BuildRequest): string {
  const params = Object.entries(request.params).sort(([a], [b]) => a.localeCompare(b));
  const content = JSON.stringify([request.nodeType, request.seed, params]);
  return hashString(content).toString(36) + hashString(`salt:${content}`).toString(36);
}

export function wholeWorldSpecOf(nodeType: string): WholeWorldSpec | null {
  return nodeTypeOf(nodeType)?.wholeWorld ?? null;
}

export function isWholeWorldNode(node: NodeInstance): boolean {
  return wholeWorldSpecOf(node.type) !== null;
}

export function wholeWorldNodesOf(nodes: readonly NodeInstance[]): NodeInstance[] {
  return nodes.filter((node) => node.enabled && isWholeWorldNode(node));
}

export function buildRequestOf(seed: number, node: NodeInstance): BuildRequest {
  return { nodeType: node.type, seed, params: { ...node.params } };
}

export function estimatedBuildMsOf(request: BuildRequest): number {
  return wholeWorldSpecOf(request.nodeType)?.estimateMs(request.params) ?? 0;
}

export function runWholeWorldBuild(request: BuildRequest, report: ProgressReport): unknown {
  const spec = wholeWorldSpecOf(request.nodeType);
  if (!spec) throw new Error(`node type '${request.nodeType}' builds no whole world`);
  return spec.build({ seed: request.seed, params: request.params, report });
}

export function serializedWholeWorldBuild(request: BuildRequest, report: ProgressReport): unknown {
  const spec = wholeWorldSpecOf(request.nodeType);
  if (!spec) throw new Error(`node type '${request.nodeType}' builds no whole world`);
  return spec.serialize(spec.build({ seed: request.seed, params: request.params, report }));
}

export function progressOfState(
  request: BuildRequest,
  state: BuildState,
  fraction: number,
  stage: string,
  elapsedMs: number,
  error: string | null = null,
): BuildProgress {
  return {
    key: buildKeyOf(request),
    nodeType: request.nodeType,
    state,
    fraction,
    stage,
    elapsedMs,
    estimatedMs: estimatedBuildMsOf(request),
    error,
  };
}

interface SynchronousEntry {
  request: BuildRequest;
  value: unknown;
  serialized: unknown | null;
  progress: BuildProgress;
}

export function synchronousBuilds(): WorldBuilds {
  const entries = new Map<string, SynchronousEntry>();
  const listeners = new Set<() => void>();
  const entryFor = (request: BuildRequest): SynchronousEntry => {
    const key = buildKeyOf(request);
    const known = entries.get(key);
    if (known) return known;
    const startedAt = Date.now();
    let entry: SynchronousEntry;
    try {
      const value = runWholeWorldBuild(request, () => undefined);
      entry = {
        request,
        value,
        serialized: null,
        progress: progressOfState(request, 'ready', 1, 'built', Date.now() - startedAt),
      };
    } catch (error) {
      entry = {
        request,
        value: null,
        serialized: null,
        progress: progressOfState(request, 'failed', 0, 'failed', Date.now() - startedAt, messageOf(error)),
      };
    }
    entries.set(key, entry);
    while (entries.size > READY_BUILDS_KEPT) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
    for (const listener of listeners) listener();
    return entry;
  };
  return {
    valueOf: (request) => entryFor(request).value,
    progressOf: (request) => entries.get(buildKeyOf(request))?.progress ?? null,
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    request: (request) => entryFor(request).progress,
    statusOf: (key) => entries.get(key)?.progress ?? null,
    serializedOf: (key) => {
      const entry = entries.get(key);
      if (!entry || entry.progress.state !== 'ready') return null;
      entry.serialized ??= wholeWorldSpecOf(entry.request.nodeType)!.serialize(entry.value);
      return entry.serialized;
    },
    summary: () => summaryOf([...entries.values()].map((entry) => entry.progress)),
  };
}

export const NO_BUILT_VALUES: BuiltValueSource = {
  valueOf: () => null,
  progressOf: () => null,
  onChange: () => () => undefined,
};

export function summaryOf(progress: readonly BuildProgress[]): BuildSummary {
  const summary: BuildSummary = { queued: 0, building: 0, ready: 0, failed: 0 };
  for (const each of progress) summary[each.state] += 1;
  return summary;
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
