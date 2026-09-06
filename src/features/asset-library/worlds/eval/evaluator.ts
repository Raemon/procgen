import { chunkKey } from '../chunk';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type NodeTypeDef } from '../nodeType';
import { computeNodeSignatures } from '../pipeline/nodeSignatures';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { PipelineStore } from '../pipeline/pipelineStore';
import { emptyValueOfKind, type ChunkValue } from '../values/chunkValues';
import {
  buildRequestOf,
  synchronousBuilds,
  wholeWorldNodesOf,
  type BuildProgress,
  type BuiltValueSource,
} from './builtValues';
import { cacheCapacityForPipeline } from './cacheCapacity';
import { ChunkValueCache } from './chunkValueCache';
import { createChunkGenCtx } from './genCtxFactory';
import { RegionMemoCache } from './regionMemoCache';

const REGION_MEMOS_KEPT = 64;

export class PipelineEvaluator {
  private readonly cache = new ChunkValueCache(0);
  private readonly regionMemos = new RegionMemoCache(REGION_MEMOS_KEPT);
  private readonly runtimeErrors = new Map<string, string>();
  private readonly builtListeners = new Set<() => void>();
  private signatures = new Map<string, string>();
  private epoch = 0;

  constructor(
    private readonly store: PipelineStore,
    private readonly builtValues: BuiltValueSource = synchronousBuilds(),
  ) {
    this.refreshSignatures();
    store.onChange(() => this.refreshSignatures());
    builtValues.onChange(() => this.acceptBuilds());
  }

  builtValueOf(nodeId: string): unknown | null {
    const node = this.store.nodeById(nodeId);
    const def = node && nodeTypeOf(node.type);
    if (!node || !def?.wholeWorld || !node.enabled) return null;
    return this.builtValues.valueOf(buildRequestOf(this.store.seed(), node));
  }

  missingBuilds(): NodeInstance[] {
    return wholeWorldNodesOf(this.store.nodes()).filter((node) => this.builtValueOf(node.id) === null);
  }

  ready(): boolean {
    return this.missingBuilds().length === 0;
  }

  buildProgress(): BuildProgress[] {
    return this.missingBuilds().flatMap((node) => {
      const progress = this.builtValues.progressOf(buildRequestOf(this.store.seed(), node));
      return progress ? [progress] : [];
    });
  }

  onBuilt(listener: () => void): () => void {
    this.builtListeners.add(listener);
    return () => this.builtListeners.delete(listener);
  }

  private acceptBuilds(): void {
    this.epoch += 1;
    for (const listener of this.builtListeners) listener();
  }

  valueFor(nodeId: string, chunkX: number, chunkY: number): ChunkValue {
    const node = this.store.nodeById(nodeId);
    const def = node && nodeTypeOf(node.type);
    if (!node || !def) return emptyValueOfKind('field');
    if (!node.enabled) return emptyValueOfKind(outputKindOf(def, node.params));
    return this.cachedOrGenerated(node, def, chunkX, chunkY);
  }

  errorFor(nodeId: string): string | null {
    return this.runtimeErrors.get(nodeId) ?? null;
  }

  private refreshSignatures(): void {
    this.signatures = computeNodeSignatures(this.store.snapshot(), nodeTypeReadsTime);
    this.cache.growTo(cacheCapacityForPipeline(this.signatures.size));
  }

  private cachedOrGenerated(
    node: NodeInstance,
    def: NodeTypeDef,
    chunkX: number,
    chunkY: number,
  ): ChunkValue {
    const key = `${this.signatures.get(node.id)}|${this.epoch}|${chunkKey(chunkX, chunkY)}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const value = this.generate(node, def, chunkX, chunkY);
    this.cache.set(key, value);
    return value;
  }

  private generate(
    node: NodeInstance,
    def: NodeTypeDef,
    chunkX: number,
    chunkY: number,
  ): ChunkValue {
    const ctx = createChunkGenCtx({
      seed: this.store.seed(),
      time: this.store.time(),
      nodeId: node.id,
      params: node.params,
      chunkX,
      chunkY,
      resolveInput: (name, atChunkX, atChunkY) => this.resolveInput(node, name, atChunkX, atChunkY),
      memo: (key, compute) =>
        this.regionMemos.at(`${this.signatures.get(node.id)}|${this.epoch}|${key}`, compute),
      built: () => this.builtValueOf(node.id),
      builtInput: (name) => {
        const sourceId = node.inputs[name];
        return sourceId ? this.builtValueOf(sourceId) : null;
      },
    });
    try {
      const value = def.generateChunk(ctx);
      this.runtimeErrors.delete(node.id);
      return this.matchingDeclaredKind(node, def, value);
    } catch (error) {
      this.runtimeErrors.set(node.id, messageOf(error));
      return emptyValueOfKind(outputKindOf(def, node.params));
    }
  }

  private resolveInput(
    node: NodeInstance,
    inputName: string,
    chunkX: number,
    chunkY: number,
  ): ChunkValue | null {
    const sourceId = node.inputs[inputName];
    return sourceId ? this.valueFor(sourceId, chunkX, chunkY) : null;
  }

  private matchingDeclaredKind(
    node: NodeInstance,
    def: NodeTypeDef,
    value: ChunkValue,
  ): ChunkValue {
    const declared = outputKindOf(def, node.params);
    if (value.kind === declared) return value;
    this.runtimeErrors.set(node.id, `returned ${value.kind}, declared output is ${declared}`);
    return emptyValueOfKind(declared);
  }
}

function nodeTypeReadsTime(nodeType: string): boolean {
  return nodeTypeOf(nodeType)?.readsTime === true;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
