import { chunkKey } from '../chunk';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type NodeTypeDef } from '../nodeType';
import { computeNodeSignatures } from '../pipeline/nodeSignatures';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { PipelineStore } from '../pipeline/pipelineStore';
import { emptyValueOfKind, type ChunkValue } from '../values/chunkValues';
import { ChunkValueCache } from './chunkValueCache';
import { createChunkGenCtx } from './genCtxFactory';

const CACHE_CAPACITY = 4096;

export class PipelineEvaluator {
  private readonly cache = new ChunkValueCache(CACHE_CAPACITY);
  private readonly runtimeErrors = new Map<string, string>();
  private signatures = new Map<string, string>();

  constructor(private readonly store: PipelineStore) {
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
  }

  private cachedOrGenerated(
    node: NodeInstance,
    def: NodeTypeDef,
    chunkX: number,
    chunkY: number,
  ): ChunkValue {
    const key = `${this.signatures.get(node.id)}|${chunkKey(chunkX, chunkY)}`;
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
