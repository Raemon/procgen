import { chunkKey } from '../chunk';
import { clampedStride, FINE_STRIDE } from '../cellStride';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type NodeTypeDef } from '../nodeType';
import { computeNodeSignatures } from '../pipeline/nodeSignatures';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { PipelineStore } from '../pipeline/pipelineStore';
import { emptyValueOfKind, type ChunkValue } from '../values/chunkValues';
import { cacheCapacityForPipeline } from './cacheCapacity';
import { ChunkValueCache } from './chunkValueCache';
import { createChunkGenCtx } from './genCtxFactory';
import { RegionMemoCache } from './regionMemoCache';

const REGION_MEMOS_KEPT = 64;

export class PipelineEvaluator {
  private readonly cache = new ChunkValueCache(0);
  private readonly regionMemos = new RegionMemoCache(REGION_MEMOS_KEPT);
  private readonly runtimeErrors = new Map<string, string>();
  private signatures = new Map<string, string>();

  constructor(private readonly store: PipelineStore) {
    this.refreshSignatures();
    store.onChange(() => this.refreshSignatures());
  }

  valueFor(
    nodeId: string,
    chunkX: number,
    chunkY: number,
    stride: number = FINE_STRIDE,
  ): ChunkValue {
    const node = this.store.nodeById(nodeId);
    const def = node && nodeTypeOf(node.type);
    if (!node || !def) return emptyValueOfKind('field');
    if (!node.enabled) return emptyValueOfKind(outputKindOf(def, node.params));
    return this.cachedOrGenerated(node, def, chunkX, chunkY, clampedStride(stride));
  }

  errorFor(nodeId: string): string | null {
    return this.runtimeErrors.get(nodeId) ?? null;
  }

  private refreshSignatures(): void {
    this.signatures = computeNodeSignatures(this.store.snapshot());
    this.cache.growTo(cacheCapacityForPipeline(this.signatures.size));
  }

  private cachedOrGenerated(
    node: NodeInstance,
    def: NodeTypeDef,
    chunkX: number,
    chunkY: number,
    stride: number,
  ): ChunkValue {
    const key = `${this.signatures.get(node.id)}|${stride}|${chunkKey(chunkX, chunkY)}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const value = this.generate(node, def, chunkX, chunkY, stride);
    this.cache.set(key, value);
    return value;
  }

  private generate(
    node: NodeInstance,
    def: NodeTypeDef,
    chunkX: number,
    chunkY: number,
    stride: number,
  ): ChunkValue {
    const ctx = createChunkGenCtx({
      seed: this.store.seed(),
      time: this.store.time(),
      nodeId: node.id,
      params: node.params,
      chunkX,
      chunkY,
      stride,
      resolveInput: (name, atChunkX, atChunkY, atStride) =>
        this.resolveInput(node, name, atChunkX, atChunkY, atStride),
      memo: (key, compute) =>
        this.regionMemos.at(`${this.signatures.get(node.id)}|${stride}|${key}`, compute),
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
    stride: number,
  ): ChunkValue | null {
    const sourceId = node.inputs[inputName];
    return sourceId ? this.valueFor(sourceId, chunkX, chunkY, stride) : null;
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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
