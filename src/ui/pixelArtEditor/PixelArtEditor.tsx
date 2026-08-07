import type { CubeFace, CubeFaceArt } from '../../world/tiles/tileFaceArt';
import { FaceTabs } from './FaceTabs';
import { PaintToolbar } from './PaintToolbar';
import { PixelPaintCanvas } from './PixelPaintCanvas';
import { ResolutionSelect } from './ResolutionSelect';
import { TilingTools } from './TilingTools';
import { useFaceArtEditor } from './useFaceArtEditor';

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
  return (
    <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">
      {!lockedFace && (
        <FaceTabs
          settings={editor.settings}
          onSelect={editor.selectFace}
          onToggleLink={editor.toggleLinkedSides}
        />
      )}
      <PixelPaintCanvas
        pixels={editor.activePixels}
        baseColor={baseColor}
        onPaintPixel={editor.paintAt}
        onStrokeEnd={editor.endStroke}
      />
      <PaintToolbar editor={editor} />
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <ResolutionSelect size={editor.size} onSelect={editor.changeResolution} />
        <TilingTools
          pixels={editor.activePixels}
          baseColor={baseColor}
          onShift={editor.shiftFace}
        />
      </div>
    </div>
  );
}
