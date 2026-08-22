import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import type { TileId } from '@/features/asset-library/asset';
import { useRef, useState } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { EMPTY_VOXEL, voxelAt, VOXEL_FACING_COUNT, type Piece } from '../pieceDef';
import type { PieceExtent } from '../pieceResize';

export type VoxelTool = 'paint' | 'erase' | 'fill' | 'pick' | 'face';

const UNDO_DEPTH = 40;

export interface PieceEditor {
  piece: Piece;
  layer: number;
  tool: VoxelTool;
  tileId: TileId;
  facing: number;
  selectLayer(layer: number): void;
  setTool(tool: VoxelTool): void;
  setTileId(tileId: TileId): void;
  cycleFacing(): void;
  paintCell(x: number, y: number): void;
  addLayer(): void;
  removeLayer(): void;
  resize(extent: PieceExtent): void;
  rotate(): void;
  clearLayer(): void;
  copyLayer(): void;
  pasteLayer(): void;
  undo(): void;
}

export function usePieceEditor(piece: Piece): PieceEditor {
  const { perform } = useAppRuntime();
  const [layer, setLayer] = useState(0);
  const [tool, setTool] = useState<VoxelTool>('paint');
  const [tileId, setTileId] = useState(EMPTY_VOXEL);
  const [facing, setFacing] = useState(0);
  const history = useRef<number[][]>([]);
  const clipboard = useRef<TileId[] | null>(null);

  function remember(): void {
    history.current = [...history.current.slice(-UNDO_DEPTH), [...piece.voxels]];
  }

  function act(action: string, params: CommandParams): void {
    remember();
    perform(action, { piece_id: piece.id, ...params });
  }

  function resizeTo(extent: PieceExtent): void {
    remember();
    perform('resize_piece', { piece_id: piece.id, ...extent });
    setLayer(Math.min(layer, extent.layers - 1));
  }

  function paintCell(x: number, y: number): void {
    if (tool === 'pick') return setTileId(voxelAt(piece, x, y, layer));
    if (tool === 'face') return act('set_piece_voxel_facing', { x, y, layer, facing });
    const value = tool === 'erase' ? EMPTY_VOXEL : tileId;
    const action = tool === 'fill' ? 'flood_fill_piece' : 'paint_piece';
    act(action, { x, y, layer, tile_id: value });
  }

  return {
    piece,
    layer,
    tool,
    tileId,
    facing,
    selectLayer: (next) => setLayer(Math.max(0, Math.min(piece.layers - 1, next))),
    setTool,
    setTileId,
    cycleFacing: () => setFacing((current) => (current + 1) % VOXEL_FACING_COUNT),
    paintCell,
    addLayer: () => {
      resizeTo(extentOf(piece, { layers: piece.layers + 1 }));
      setLayer(Math.min(piece.layers, layer + 1));
    },
    removeLayer: () => resizeTo(extentOf(piece, { layers: piece.layers - 1 })),
    resize: resizeTo,
    rotate: () => act('rotate_piece', {}),
    clearLayer: () => act('fill_piece_layer', { layer, tile_id: EMPTY_VOXEL }),
    copyLayer: () => {
      clipboard.current = layerIndices(piece, layer).map((index) => piece.voxels[index]!);
    },
    pasteLayer: () => {
      const copied = clipboard.current;
      if (!copied) return;
      const voxels = [...piece.voxels];
      layerIndices(piece, layer).forEach((index, cell) => {
        voxels[index] = copied[cell] ?? EMPTY_VOXEL;
      });
      act('set_piece_voxels', { voxels });
    },
    undo: () => {
      const previous = history.current.pop();
      if (previous && previous.length === piece.voxels.length) {
        perform('set_piece_voxels', { piece_id: piece.id, voxels: previous });
      }
    },
  };
}

function extentOf(piece: Piece, patch: Partial<PieceExtent>): PieceExtent {
  return { width: piece.width, depth: piece.depth, layers: piece.layers, ...patch };
}

function layerIndices(piece: Piece, layer: number): number[] {
  const cells = piece.width * piece.depth;
  return Array.from({ length: cells }, (_, cell) => layer * cells + cell);
}
