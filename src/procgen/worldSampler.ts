import type { CubeFaceArt } from '../world/tiles/tileFaceArt';
import type { Tileset } from '../world/tiles/tileset';
import { cellIndexInChunk, chunkCoordOfCell } from './chunk';
import { markerAppearance } from './display/markerAppearance';
import type { PipelineEvaluator } from './eval/evaluator';
import type { NodeInstance } from './pipeline/pipelineState';
import type { PipelineStore } from './pipeline/pipelineStore';
import { EMPTY_TILE } from './values/chunkValues';
import { asField, asPoints, asTiles } from './values/valueAccess';

export interface Marker {
  x: number;
  y: number;
  glyph: string;
  color: string;
  faceArt: CubeFaceArt | null;
  tag: string;
}

export class WorldSampler {
  constructor(
    private readonly store: PipelineStore,
    private readonly evaluator: PipelineEvaluator,
    private readonly tileset: Tileset,
  ) {}

  tileAt(x: number, y: number): number {
    let tile = EMPTY_TILE;
    for (const node of this.displayedNodes('tileLayer')) {
      const layerTile = this.tileFromNode(node, x, y);
      if (layerTile !== EMPTY_TILE) tile = layerTile;
    }
    return tile;
  }

  elevationAt(x: number, y: number): number {
    const bound = this.displayedNodes('elevation');
    const node = bound[bound.length - 1];
    if (!node || node.display.mode !== 'elevation') return 0;
    const field = asField(this.chunkValueAt(node, x, y));
    return (field?.[cellIndexInChunk(x, y)] ?? 0) * node.display.heightScale;
  }

  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[] {
    const markers: Marker[] = [];
    for (const node of this.displayedNodes('markers')) {
      this.collectMarkersFromNode(node, minX, minY, maxX, maxY, markers);
    }
    return markers;
  }

  private displayedNodes(mode: 'tileLayer' | 'elevation' | 'markers'): NodeInstance[] {
    return this.store.nodes().filter((node) => node.enabled && node.display.mode === mode);
  }

  private tileFromNode(node: NodeInstance, x: number, y: number): number {
    const tiles = asTiles(this.chunkValueAt(node, x, y));
    return tiles?.[cellIndexInChunk(x, y)] ?? EMPTY_TILE;
  }

  private chunkValueAt(node: NodeInstance, x: number, y: number) {
    return this.evaluator.valueFor(node.id, chunkCoordOfCell(x), chunkCoordOfCell(y));
  }

  private collectMarkersFromNode(
    node: NodeInstance,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    into: Marker[],
  ): void {
    if (node.display.mode !== 'markers') return;
    const look = markerAppearance(this.tileset, node.display);
    for (let chunkY = chunkCoordOfCell(minY); chunkY <= chunkCoordOfCell(maxY); chunkY++) {
      for (let chunkX = chunkCoordOfCell(minX); chunkX <= chunkCoordOfCell(maxX); chunkX++) {
        const points = asPoints(this.evaluator.valueFor(node.id, chunkX, chunkY)) ?? [];
        for (const point of points) {
          if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
            into.push({ x: point.x, y: point.y, ...look, tag: point.tag });
          }
        }
      }
    }
  }
}
