import { useRef, useState } from 'react';
import {
  blankCubeFaceArt,
  blankFacePixels,
  cloneCubeFaceArt,
  faceGridSize,
  type CubeFaceArt,
  type FacePixels,
} from '../../world/tiles/tileFaceArt';
import { floodFillFacePixels } from './ops/floodFillFacePixels';
import { copyFaceToAllSides, sideFacesMatch } from './ops/linkedSideFaces';
import { mirroredPixelIndices } from './ops/mirroredPixelIndices';
import { resampleFacePixels, resizeCubeFaceArt } from './ops/resizeFaceArt';
import { shiftFacePixelsWithWrap } from './ops/shiftFacePixelsWithWrap';
import type { CubeFace } from '../../world/tiles/tileFaceArt';
import {
  activeFace,
  initialPaintSettings,
  isSideTab,
  targetFaces,
  type FaceTab,
  type PaintSettings,
  type PaintTool,
} from './paintSettings';
import type { StrokePhase } from './PixelPaintCanvas';
import { useFaceArtHistory } from './useFaceArtHistory';

export interface FaceArtSource {
  art: CubeFaceArt | null;
  baseColor: string;
  lockedFace?: CubeFace;
  onChange(art: CubeFaceArt | null): void;
}

export interface FaceArtEditor {
  settings: PaintSettings;
  size: number;
  activePixels: FacePixels;
  updateSettings(patch: Partial<PaintSettings>): void;
  selectFace(tab: FaceTab): void;
  toggleLinkedSides(): void;
  setTool(tool: PaintTool): void;
  paintAt(index: number, phase: StrokePhase): void;
  endStroke(): void;
  undo(): void;
  copyFace(): void;
  pasteFace(): void;
  clearFace(): void;
  shiftFace(dx: number, dy: number): void;
  changeResolution(size: number): void;
}

export function useFaceArtEditor({
  art,
  baseColor,
  lockedFace,
  onChange,
}: FaceArtSource): FaceArtEditor {
  const [settings, setSettings] = useState(() =>
    initialPaintSettings(art, baseColor, lockedFace),
  );
  const [strokeArt, setStrokeArt] = useState<CubeFaceArt | null>(null);
  const clipboard = useRef<FacePixels | null>(null);
  const history = useFaceArtHistory(art, onChange);
  const size = strokeArt?.size ?? art?.size ?? settings.size;
  const paintedArt = strokeArt ?? art;

  const updateSettings = (patch: Partial<PaintSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  function editableArt(): CubeFaceArt {
    return art ? cloneCubeFaceArt(art) : blankCubeFaceArt(size);
  }

  function commitToTargetFaces(transform: (pixels: FacePixels) => FacePixels): void {
    const next = editableArt();
    for (const face of targetFaces(settings)) next[face] = transform(next[face]);
    history.commit(next);
  }

  function toggleLinkedSides(): void {
    if (settings.linkedSides) return unlinkSides();
    relinkSidesTo(isSideTab(settings.faceTab) ? activeFace(settings) : 'north');
  }

  function unlinkSides(): void {
    updateSettings({
      linkedSides: false,
      faceTab: settings.faceTab === 'sides' ? 'north' : settings.faceTab,
    });
  }

  function relinkSidesTo(sourceFace: ReturnType<typeof activeFace>): void {
    updateSettings({ linkedSides: true, faceTab: 'sides' });
    if (art && !sideFacesMatch(art)) history.commit(copyFaceToAllSides(art, sourceFace));
  }

  function paintAt(index: number, phase: StrokePhase): void {
    if (settings.tool === 'pick') return void (phase === 'start' && pickColorAt(index));
    if (settings.tool === 'fill')
      return void (phase === 'start' &&
        commitToTargetFaces((pixels) =>
          floodFillFacePixels(pixels, size, index, settings.paintColor),
        ));
    strokePaintAt(index);
  }

  function pickColorAt(index: number): void {
    updateSettings({ paintColor: art?.[activeFace(settings)][index] ?? baseColor, tool: 'draw' });
  }

  function strokePaintAt(index: number): void {
    const next = strokeArt ? cloneCubeFaceArt(strokeArt) : editableArt();
    const value = settings.tool === 'erase' ? null : settings.paintColor;
    for (const face of targetFaces(settings))
      for (const mirrored of mirroredPixelIndices(index, size, settings.mirrorX, settings.mirrorY))
        next[face][mirrored] = value;
    setStrokeArt(next);
  }

  function endStroke(): void {
    if (!strokeArt) return;
    setStrokeArt(null);
    history.commit(strokeArt);
  }

  function pasteFace(): void {
    const copied = clipboard.current;
    if (!copied) return;
    const pixels = resampleFacePixels(copied, faceGridSize(copied), size);
    commitToTargetFaces(() => [...pixels]);
  }

  function changeResolution(nextSize: number): void {
    if (art) history.commit(resizeCubeFaceArt(art, nextSize));
    updateSettings({ size: nextSize });
  }

  return {
    settings,
    size,
    activePixels: paintedArt?.[activeFace(settings)] ?? blankFacePixels(size),
    updateSettings,
    selectFace: (faceTab) => updateSettings({ faceTab }),
    toggleLinkedSides,
    setTool: (tool) => updateSettings({ tool }),
    paintAt,
    endStroke,
    undo: history.undo,
    copyFace: () => (clipboard.current = [...(paintedArt?.[activeFace(settings)] ?? [])]),
    pasteFace,
    clearFace: () => commitToTargetFaces(() => blankFacePixels(size)),
    shiftFace: (dx, dy) => {
      if (art) commitToTargetFaces((pixels) => shiftFacePixelsWithWrap(pixels, size, dx, dy));
    },
    changeResolution,
  };
}
