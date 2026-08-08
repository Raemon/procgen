import { Button } from '../../../frontend/controls/Button';
import type { PieceEditor, VoxelTool } from './usePieceEditor';
import { FACING_GLYPHS } from './facingGlyphs';
import { FACING_TIP, PIECE_EDIT_TIPS, VOXEL_TOOL_TIPS } from './help/pieceTips';

const TOOLS: { tool: VoxelTool; label: string }[] = [
  { tool: 'paint', label: 'paint' },
  { tool: 'erase', label: 'erase' },
  { tool: 'fill', label: 'fill' },
  { tool: 'pick', label: 'pick' },
  { tool: 'face', label: 'face' },
];


const TOOL_CLASSES = 'px-2 py-0.5 text-[11px]';

export function PieceToolbar({ editor }: { editor: PieceEditor }) {
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
        <Button className={TOOL_CLASSES} tip={FACING_TIP} onClick={editor.cycleFacing}>
          {FACING_GLYPHS[editor.facing]}
        </Button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Button className={TOOL_CLASSES} tip={PIECE_EDIT_TIPS.undo} onClick={editor.undo}>
          undo
        </Button>
        <Button className={TOOL_CLASSES} tip={PIECE_EDIT_TIPS.rotate} onClick={editor.rotate}>
          rotate
        </Button>
        <Button className={TOOL_CLASSES} tip={PIECE_EDIT_TIPS.copy} onClick={editor.copyLayer}>
          copy
        </Button>
        <Button className={TOOL_CLASSES} tip={PIECE_EDIT_TIPS.paste} onClick={editor.pasteLayer}>
          paste
        </Button>
        <Button className={TOOL_CLASSES} tip={PIECE_EDIT_TIPS.clear} onClick={editor.clearLayer}>
          clear
        </Button>
      </div>
    </>
  );
}
