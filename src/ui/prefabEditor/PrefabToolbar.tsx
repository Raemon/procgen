import { Button } from '../controls/Button';
import type { PrefabEditor, VoxelTool } from './usePrefabEditor';
import { PREFAB_EDIT_TIPS, VOXEL_TOOL_TIPS } from './help/prefabTips';

const TOOLS: { tool: VoxelTool; label: string }[] = [
  { tool: 'paint', label: 'paint' },
  { tool: 'erase', label: 'erase' },
  { tool: 'fill', label: 'fill' },
  { tool: 'pick', label: 'pick' },
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
            tip={VOXEL_TOOL_TIPS[spec.tool]}
            active={editor.tool === spec.tool}
            onClick={() => editor.setTool(spec.tool)}
          >
            {spec.label}
          </Button>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Button className={TOOL_CLASSES} tip={PREFAB_EDIT_TIPS.undo} onClick={editor.undo}>
          undo
        </Button>
        <Button className={TOOL_CLASSES} tip={PREFAB_EDIT_TIPS.rotate} onClick={editor.rotate}>
          rotate
        </Button>
        <Button className={TOOL_CLASSES} tip={PREFAB_EDIT_TIPS.copy} onClick={editor.copyLayer}>
          copy
        </Button>
        <Button className={TOOL_CLASSES} tip={PREFAB_EDIT_TIPS.paste} onClick={editor.pasteLayer}>
          paste
        </Button>
        <Button className={TOOL_CLASSES} tip={PREFAB_EDIT_TIPS.clear} onClick={editor.clearLayer}>
          clear
        </Button>
      </div>
    </>
  );
}
