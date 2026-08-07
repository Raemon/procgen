import { useRef, useState } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { EMPTY_VOXEL, voxelAt, type Prefab } from '../prefabDef';
import type { PrefabExtent } from '../prefabResize';

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

export function usePrefabEditor(prefab: Prefab): PrefabEditor {
  const { perform } = useAppRuntime();
  const [layer, setLayer] = useState(0);
  const [tool, setTool] = useState<VoxelTool>('paint');
  const [tileId, setTileId] = useState(EMPTY_VOXEL);
  const history = useRef<number[][]>([]);
  const clipboard = useRef<number[] | null>(null);

  function remember(): void {
    history.current = [...history.current.slice(-UNDO_DEPTH), [...prefab.voxels]];
  }

  function act(action: string, params: Record<string, unknown>): void {
    remember();
    perform(action, { prefab_id: prefab.id, ...params });
  }

  function resizeTo(extent: PrefabExtent): void {
    remember();
    perform('resize_prefab', { prefab_id: prefab.id, ...extent });
    setLayer(Math.min(layer, extent.layers - 1));
  }

  function paintCell(x: number, y: number): void {
    if (tool === 'pick') return setTileId(voxelAt(prefab, x, y, layer));
    const value = tool === 'erase' ? EMPTY_VOXEL : tileId;
    const action = tool === 'fill' ? 'flood_fill_prefab' : 'paint_prefab';
    act(action, { x, y, layer, tile_id: value });
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
      resizeTo(extentOf(prefab, { layers: prefab.layers + 1 }));
      setLayer(Math.min(prefab.layers, layer + 1));
    },
    removeLayer: () => resizeTo(extentOf(prefab, { layers: prefab.layers - 1 })),
    resize: resizeTo,
    rotate: () => act('rotate_prefab', {}),
    clearLayer: () => act('fill_prefab_layer', { layer, tile_id: EMPTY_VOXEL }),
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
      act('set_prefab_voxels', { voxels });
    },
    undo: () => {
      const previous = history.current.pop();
      if (previous && previous.length === prefab.voxels.length) {
        perform('set_prefab_voxels', { prefab_id: prefab.id, voxels: previous });
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
