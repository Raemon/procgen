import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { Piece } from '../pieceDef';
import { LayerStepper } from './LayerStepper';
import { PiecePreview3D } from './PiecePreview3D';
import { PieceSizeRow } from './PieceSizeRow';
import { PieceToolbar } from './PieceToolbar';
import { TilePalette } from './TilePalette';
import { usePieceEditor } from './usePieceEditor';
import { VoxelLayerCanvas } from './VoxelLayerCanvas';

export function PieceEditorBody({ piece }: { piece: Piece }) {
  const { tileAssets } = useAppRuntime();
  const editor = usePieceEditor(piece);
  return (
    <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">
      <LayerStepper editor={editor} />
      <VoxelLayerCanvas
        piece={piece}
        layer={editor.layer}
        tileAssets={tileAssets}
        onPaintCell={editor.paintCell}
      />
      <TilePalette tileAssets={tileAssets} tileId={editor.tileId} onPick={editor.setTileId} />
      <PieceToolbar editor={editor} />
      <PieceSizeRow editor={editor} />
      <PiecePreview3D piece={piece} tileAssets={tileAssets} />
    </div>
  );
}
