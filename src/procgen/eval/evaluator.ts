import { chunkKey } from '../chunk';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type NodeTypeDef } from '../nodeType';
import { computeNodeSignatures } from '../pipeline/nodeSignatures';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { PipelineStore } from '../pipeline/pipelineStore';
import { emptyValueOfKind, type ChunkValue } from '../values/chunkValues';
import { cacheCapacityForPipeline } from './cacheCapacity';
import { ChunkValueCache } from './chunkValueCache';
import { FieldOffsets, NO_FIELD_OFFSETS } from './fieldOffsets';
import { createChunkGenCtx } from './genCtxFactory';

export class PipelineEvaluator {
  private readonly cache = new ChunkValueCache(0);
  private readonly runtimeErrors = new Map<string, string>();
  private signatures = new Map<string, string>();

  constructor(
    private readonly store: PipelineStore,
    private readonly offsets: FieldOffsets = NO_FIELD_OFFSETS,
  ) {
    this.refreshSignatures();
    store.onChange(() => this.refreshSignatures());
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
    this.signatures = computeNodeSignatures(this.store.snapshot());
    this.cache.growTo(cacheCapacityForPipeline(this.signatures.size));
  }

  private cachedOrGenerated(
    node: NodeInstance,
    def: NodeTypeDef,
    chunkX: number,
    chunkY: number,
  ): ChunkValue {
    const key = `${this.signatures.get(node.id)}|${chunkKey(chunkX, chunkY)}|${this.offsets.revision()}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const value = this.offsetApplied(node.id, this.generate(node, def, chunkX, chunkY));
    this.cache.set(key, value);
    return value;
  }

  private offsetApplied(nodeId: string, value: ChunkValue): ChunkValue {
    const offset = this.offsets.offsetFor(nodeId);
    if (offset === 0 || value.kind !== 'field') return value;
    return { kind: 'field', field: Float32Array.from(value.field, (cell) => cell + offset) };
  }

  private generate(
    node: NodeInstance,
    def: NodeTypeDef,
    chunkX: number,
    chunkY: number,
  ): ChunkValue {
    const ctx = createChunkGenCtx({
      seed: this.store.seed(),
      nodeId: node.id,
      params: node.params,
      chunkX,
      chunkY,
      resolveInput: (name, atChunkX, atChunkY) =>
        this.resolveInput(node, name, atChunkX, atChunkY),
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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
