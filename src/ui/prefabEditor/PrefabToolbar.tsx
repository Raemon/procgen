import { Button } from '../controls/Button';
import type { PrefabEditor, VoxelTool } from './usePrefabEditor';

const TOOLS: { tool: VoxelTool; label: string; title: string }[] = [
  { tool: 'paint', label: 'paint', title: 'paint voxels with the selected tile' },
  { tool: 'erase', label: 'erase', title: 'clear voxels back to empty' },
  { tool: 'fill', label: 'fill', title: 'flood-fill this layer from the clicked cell' },
  { tool: 'pick', label: 'pick', title: 'pick the tile under the cursor' },
];

const TOOL_CLASSES = 'px-2 py-0.5 text-[11px]';

export function PrefabToolbar({ editor }: { editor: PrefabEditor }) {
  return (
    <>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {TOOLS.map((spec) => (
          <Button
            key={spec.tool}
            className={TOOL_CLASSES}
            title={spec.title}
            active={editor.tool === spec.tool}
            onClick={() => editor.setTool(spec.tool)}
          >
            {spec.label}
          </Button>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Button className={TOOL_CLASSES} title="undo the last voxel edit" onClick={editor.undo}>
          undo
        </Button>
        <Button className={TOOL_CLASSES} title="turn the whole prefab 90°" onClick={editor.rotate}>
          rotate
        </Button>
        <Button className={TOOL_CLASSES} title="copy this layer" onClick={editor.copyLayer}>
          copy
        </Button>
        <Button className={TOOL_CLASSES} title="paste onto this layer" onClick={editor.pasteLayer}>
          paste
        </Button>
        <Button className={TOOL_CLASSES} title="empty this layer" onClick={editor.clearLayer}>
          clear
        </Button>
      </div>
    </>
  );
}
