import { useRef, useState } from 'react';
import { EMPTY_VOXEL, voxelAt, voxelIndex, type Prefab } from '../../prefabs/prefabDef';
import type { PrefabLibrary } from '../../prefabs/prefabLibrary';
import { resizedPrefab, type PrefabExtent } from '../../prefabs/prefabResize';
import { rotatedPrefab } from '../../prefabs/prefabRotation';
import { floodFilledIndices } from './ops/floodFillLayer';

export type VoxelTool = 'paint' | 'erase' | 'fill' | 'pick';

const UNDO_DEPTH = 40;

export interface PrefabEditor {
  prefab: Prefab;
  layer: number;
  tool: VoxelTool;
  tileId: number;
  selectLayer(layer: number): void;
  setTool(tool: VoxelTool): void;
  setTileId(tileId: number): void;
  paintCell(x: number, y: number): void;
  addLayer(): void;
  removeLayer(): void;
  resize(extent: PrefabExtent): void;
  rotate(): void;
  clearLayer(): void;
  copyLayer(): void;
  pasteLayer(): void;
  undo(): void;
}

export function usePrefabEditor(prefab: Prefab, library: PrefabLibrary): PrefabEditor {
  const [layer, setLayer] = useState(0);
  const [tool, setTool] = useState<VoxelTool>('paint');
  const [tileId, setTileId] = useState(EMPTY_VOXEL);
  const history = useRef<number[][]>([]);
  const clipboard = useRef<number[] | null>(null);

  function commit(voxels: number[], extent?: Partial<Prefab>): void {
    history.current = [...history.current.slice(-UNDO_DEPTH), [...prefab.voxels]];
    library.update(prefab.id, { voxels, ...extent });
  }

  function paintIndices(indices: number[], value: number): void {
    const voxels = [...prefab.voxels];
    for (const index of indices) voxels[index] = value;
    commit(voxels);
  }

  function paintCell(x: number, y: number): void {
    if (tool === 'pick') return setTileId(voxelAt(prefab, x, y, layer));
    const value = tool === 'erase' ? EMPTY_VOXEL : tileId;
    if (tool === 'fill') return paintIndices(floodFilledIndices(prefab, layer, x, y), value);
    paintIndices([voxelIndex(prefab, x, y, layer)], value);
  }

  function replacePrefab(next: Prefab): void {
    history.current = [...history.current.slice(-UNDO_DEPTH), [...prefab.voxels]];
    library.update(prefab.id, {
      voxels: next.voxels,
      width: next.width,
      depth: next.depth,
      layers: next.layers,
      anchorX: next.anchorX,
      anchorY: next.anchorY,
    });
    setLayer(Math.min(layer, next.layers - 1));
  }

  return {
    prefab,
    layer,
    tool,
    tileId,
    selectLayer: (next) => setLayer(Math.max(0, Math.min(prefab.layers - 1, next))),
    setTool,
    setTileId,
    paintCell,
    addLayer: () => {
      replacePrefab(resizedPrefab(prefab, extentOf(prefab, { layers: prefab.layers + 1 })));
      setLayer(Math.min(prefab.layers, layer + 1));
    },
    removeLayer: () =>
      replacePrefab(resizedPrefab(prefab, extentOf(prefab, { layers: prefab.layers - 1 }))),
    resize: (extent) => replacePrefab(resizedPrefab(prefab, extent)),
    rotate: () => replacePrefab(rotatedPrefab(prefab, 1)),
    clearLayer: () => paintIndices(layerIndices(prefab, layer), EMPTY_VOXEL),
    copyLayer: () => {
      clipboard.current = layerIndices(prefab, layer).map((index) => prefab.voxels[index]!);
    },
    pasteLayer: () => {
      const copied = clipboard.current;
      if (!copied) return;
      const voxels = [...prefab.voxels];
      layerIndices(prefab, layer).forEach((index, cell) => {
        voxels[index] = copied[cell] ?? EMPTY_VOXEL;
      });
      commit(voxels);
    },
    undo: () => {
      const previous = history.current.pop();
      if (previous && previous.length === prefab.voxels.length) {
        library.update(prefab.id, { voxels: previous });
      }
    },
  };
}

function extentOf(prefab: Prefab, patch: Partial<PrefabExtent>): PrefabExtent {
  return { width: prefab.width, depth: prefab.depth, layers: prefab.layers, ...patch };
}

function layerIndices(prefab: Prefab, layer: number): number[] {
  const cells = prefab.width * prefab.depth;
  return Array.from({ length: cells }, (_, cell) => layer * cells + cell);
}
