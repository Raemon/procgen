import type { ReactNode } from 'react';
import { Button } from '../../frontend/controls/Button';
import { ColorField } from '../../frontend/controls/ColorField';
import { HeightInkField } from './HeightInkField';
import type { PaintTool } from './paintSettings';
import type { FaceArtEditor } from './useFaceArtEditor';
import { PAINT_COLOR_TIP, PAINT_EDIT_TIPS, PAINT_TOOL_TIPS } from './help/paintTips';

const TOOLS: { tool: PaintTool; label: string }[] = [
  { tool: 'draw', label: 'draw' },
  { tool: 'erase', label: 'erase' },
  { tool: 'fill', label: 'fill' },
  { tool: 'pick', label: 'pick' },
];

const TOOL_CLASSES = 'px-2 py-0.5 text-[11px]';

export function PaintToolbar({ editor }: { editor: FaceArtEditor }) {
  const { settings, updateSettings } = editor;
  return (
    <>
      <ToolRow>
        {settings.layer === 'height' ? (
          <HeightInkField
            ink={settings.heightInk}
            onChange={(heightInk) => updateSettings({ heightInk })}
          />
        ) : (
          <ColorField
            ink={settings.paintColor}
            tip={PAINT_COLOR_TIP}
            onChange={(paintColor) => updateSettings({ paintColor })}
          />
        )}
        {TOOLS.map((spec) => (
          <Button
            key={spec.tool}
            className={TOOL_CLASSES}
            tip={PAINT_TOOL_TIPS[spec.tool]}
            active={settings.tool === spec.tool}
            onClick={() => editor.setTool(spec.tool)}
          >
            {spec.label}
          </Button>
        ))}
      </ToolRow>
      <ToolRow>
        <Button
          className={TOOL_CLASSES}
          tip={PAINT_EDIT_TIPS.mirrorX}
          active={settings.mirrorX}
          onClick={() => updateSettings({ mirrorX: !settings.mirrorX })}
        >
          mir x
        </Button>
        <Button
          className={TOOL_CLASSES}
          tip={PAINT_EDIT_TIPS.mirrorY}
          active={settings.mirrorY}
          onClick={() => updateSettings({ mirrorY: !settings.mirrorY })}
        >
          mir y
        </Button>
        <Button className={TOOL_CLASSES} tip={PAINT_EDIT_TIPS.undo} onClick={editor.undo}>
          undo
        </Button>
        <Button className={TOOL_CLASSES} tip={PAINT_EDIT_TIPS.copy} onClick={editor.copyFace}>
          copy
        </Button>
        <Button
          className={TOOL_CLASSES}
          tip={PAINT_EDIT_TIPS.paste}
          onClick={editor.pasteFace}
        >
          paste
        </Button>
        <Button
          className={TOOL_CLASSES}
          tip={PAINT_EDIT_TIPS.clear}
          onClick={editor.clearFace}
        >
          clear
        </Button>
      </ToolRow>
    </>
  );
}

function ToolRow({ children }: { children: ReactNode }) {
  return <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{children}</div>;
}
