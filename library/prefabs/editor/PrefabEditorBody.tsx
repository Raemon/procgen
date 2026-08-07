import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { Prefab } from '../prefabDef';
import { LayerStepper } from './LayerStepper';
import { PrefabPreview3D } from './PrefabPreview3D';
import { PrefabSizeRow } from './PrefabSizeRow';
import { PrefabToolbar } from './PrefabToolbar';
import { TilePalette } from './TilePalette';
import { usePrefabEditor } from './usePrefabEditor';
import { VoxelLayerCanvas } from './VoxelLayerCanvas';

export function PrefabEditorBody({ prefab }: { prefab: Prefab }) {
  const { tileset } = useAppRuntime();
  const editor = usePrefabEditor(prefab);
  return (
    <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">
      <LayerStepper editor={editor} />
      <VoxelLayerCanvas
        prefab={prefab}
        layer={editor.layer}
        tileset={tileset}
        onPaintCell={editor.paintCell}
      />
      <TilePalette tileset={tileset} tileId={editor.tileId} onPick={editor.setTileId} />
      <PrefabToolbar editor={editor} />
      <PrefabSizeRow editor={editor} />
      <PrefabPreview3D prefab={prefab} tileset={tileset} />
    </div>
  );
}
