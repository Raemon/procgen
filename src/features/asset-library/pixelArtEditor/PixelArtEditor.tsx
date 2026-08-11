import { FLAT_HEIGHT_INK } from '../tiles/faceArtHeight';
import { DrawerPanel } from '@/features/app-shell/controls/DrawerPanel';
import type { CubeFace, CubeFaceArt } from '../tiles/tileFaceArt';
import { FaceTabs } from './FaceTabs';
import { FrameStrip } from './FrameStrip';
import { LayerTabs } from './LayerTabs';
import { PaintToolbar } from './PaintToolbar';
import { PixelPaintCanvas } from './PixelPaintCanvas';
import { ResolutionSelect } from './ResolutionSelect';
import { TilingTools } from './TilingTools';
import { useFaceArtEditor } from './useFaceArtEditor';
import { useFramePlayback } from './useFramePlayback';

export function PixelArtEditor({
  art,
  baseColor,
  lockedFace,
  onChange,
}: {
  art: CubeFaceArt | null;
  baseColor: string;
  lockedFace?: CubeFace;
  onChange(art: CubeFaceArt | null): void;
}) {
  const editor = useFaceArtEditor({ art, baseColor, lockedFace, onChange });
  useFramePlayback(editor);
  const canvasBase = editor.settings.layer === 'height' ? FLAT_HEIGHT_INK : baseColor;
  const stillPicture = Boolean(lockedFace);
  return (
    <DrawerPanel>
      {!stillPicture && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          <FaceTabs
            settings={editor.settings}
            onSelect={editor.selectFace}
            onToggleLink={editor.toggleLinkedSides}
          />
          <LayerTabs layer={editor.settings.layer} onSelect={editor.selectLayer} />
        </div>
      )}
      <PixelPaintCanvas
        pixels={editor.activePixels}
        baseColor={canvasBase}
        onPaintPixel={editor.paintAt}
        onStrokeEnd={editor.endStroke}
      />
      {!stillPicture && <FrameStrip editor={editor} />}
      <PaintToolbar editor={editor} />
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <ResolutionSelect size={editor.size} onSelect={editor.changeResolution} />
        <TilingTools
          pixels={editor.activePixels}
          baseColor={canvasBase}
          onShift={editor.shiftFace}
        />
      </div>
    </DrawerPanel>
  );
}
