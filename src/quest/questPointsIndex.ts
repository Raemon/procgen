import { chunkCoordOfCell } from '../procgen/chunk';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import { outputKindOf } from '../procgen/nodeType';
import type { NodeInstance } from '../procgen/pipeline/pipelineState';
import type { ChunkValue } from '../procgen/values/chunkValues';
import { asPoints } from '../procgen/values/valueAccess';
import { isQuestTag } from './questTags';

export interface QuestPointSource {
  nodes(): readonly NodeInstance[];
  valueFor(nodeId: string, chunkX: number, chunkY: number): ChunkValue | null;
}

export class QuestPointsIndex {
  private readonly cellTagsByChunk = new Map<string, Map<string, string[]>>();

  constructor(private readonly source: QuestPointSource) {}

  invalidate(): void {
    this.cellTagsByChunk.clear();
  }

  tagsAt(x: number, y: number): readonly string[] {
    const chunk = this.chunkCells(chunkCoordOfCell(x), chunkCoordOfCell(y));
    return chunk.get(`${x},${y}`) ?? [];
  }

  private chunkCells(chunkX: number, chunkY: number): Map<string, string[]> {
    const chunkKey = `${chunkX},${chunkY}`;
    const cached = this.cellTagsByChunk.get(chunkKey);
    if (cached) return cached;
    const built = this.buildChunkCells(chunkX, chunkY);
    this.cellTagsByChunk.set(chunkKey, built);
    return built;
  }

  private buildChunkCells(chunkX: number, chunkY: number): Map<string, string[]> {
    const cells = new Map<string, string[]>();
    for (const node of this.enabledPointsNodes()) {
      this.collectQuestTags(node, chunkX, chunkY, cells);
    }
    return cells;
  }

  private collectQuestTags(
    node: NodeInstance,
    chunkX: number,
    chunkY: number,
    cells: Map<string, string[]>,
  ): void {
    const points = asPoints(this.source.valueFor(node.id, chunkX, chunkY)) ?? [];
    for (const point of points) {
      if (!isQuestTag(point.tag)) continue;
      const cellKey = `${point.x},${point.y}`;
      const tags = cells.get(cellKey) ?? [];
      tags.push(point.tag);
      cells.set(cellKey, tags);
    }
  }

  private enabledPointsNodes(): NodeInstance[] {
    return this.source.nodes().filter((node) => node.enabled && outputsPoints(node));
  }
}

function outputsPoints(node: NodeInstance): boolean {
  const def = nodeTypeOf(node.type);
  return def !== undefined && outputKindOf(def, node.params) === 'points';
}
