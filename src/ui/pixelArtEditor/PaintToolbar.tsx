import type { ReactNode } from 'react';
import { Button } from '../controls/Button';
import { COLOR_INPUT_CLASSES } from '../controls/fieldClasses';
import type { PaintTool } from './paintSettings';
import type { FaceArtEditor } from './useFaceArtEditor';

const TOOLS: { tool: PaintTool; label: string; title: string }[] = [
  { tool: 'draw', label: 'draw', title: 'paint pixels with the current color' },
  { tool: 'erase', label: 'erase', title: 'reset pixels to the base tile color' },
  { tool: 'fill', label: 'fill', title: 'flood-fill a region with the current color' },
  { tool: 'pick', label: 'pick', title: 'pick a color from the canvas' },
];

const TOOL_CLASSES = 'px-2 py-0.5 text-[11px]';

export function PaintToolbar({ editor }: { editor: FaceArtEditor }) {
  const { settings, updateSettings } = editor;
  return (
    <>
      <ToolRow>
        <input
          type="color"
          className={COLOR_INPUT_CLASSES}
          title="paint color"
          value={settings.paintColor}
          onChange={(event) => updateSettings({ paintColor: event.target.value })}
        />
        {TOOLS.map((spec) => (
          <Button
            key={spec.tool}
            className={TOOL_CLASSES}
            title={spec.title}
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
          title="mirror strokes left↔right"
          active={settings.mirrorX}
          onClick={() => updateSettings({ mirrorX: !settings.mirrorX })}
        >
          mir x
        </Button>
        <Button
          className={TOOL_CLASSES}
          title="mirror strokes top↕bottom"
          active={settings.mirrorY}
          onClick={() => updateSettings({ mirrorY: !settings.mirrorY })}
        >
          mir y
        </Button>
        <Button className={TOOL_CLASSES} title="undo the last edit" onClick={editor.undo}>
          undo
        </Button>
        <Button className={TOOL_CLASSES} title="copy this face" onClick={editor.copyFace}>
          copy
        </Button>
        <Button
          className={TOOL_CLASSES}
          title="paste the copied face here"
          onClick={editor.pasteFace}
        >
          paste
        </Button>
        <Button
          className={TOOL_CLASSES}
          title="reset this face to the base color"
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
