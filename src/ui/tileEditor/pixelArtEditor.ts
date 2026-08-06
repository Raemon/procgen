import { floodFillFacePixels } from '../../world/tiles/faceArtOps/floodFillFacePixels';
import {
  copyFaceToAllSides,
  sideFacesMatch,
} from '../../world/tiles/faceArtOps/linkedSideFaces';
import { mirroredPixelIndices } from '../../world/tiles/faceArtOps/mirroredPixelIndices';
import {
  resampleFacePixels,
  resizeCubeFaceArt,
} from '../../world/tiles/faceArtOps/resizeFaceArt';
import { shiftFacePixelsWithWrap } from '../../world/tiles/faceArtOps/shiftFacePixelsWithWrap';
import type { TileDef } from '../../world/tiles/tileDef';
import {
  blankCubeFaceArt,
  blankFacePixels,
  cloneCubeFaceArt,
  faceGridSize,
  type CubeFaceArt,
  type FacePixels,
} from '../../world/tiles/tileFaceArt';
import type { EditableTileFields } from '../../world/tiles/tileset';
import { faceArtHistory } from './faceArtHistory';
import { faceTabs } from './faceTabs';
import {
  activeFace,
  initialPaintState,
  isSideTab,
  targetFaces,
  type FaceTab,
} from './paintState';
import { paintToolbar } from './paintToolbar';
import { pixelPaintCanvas, type StrokePhase } from './pixelPaintCanvas';
import { resolutionSelect } from './resolutionSelect';
import { tilingTools } from './tilingTools';

export interface PixelArtEditor {
  root: HTMLElement;
  refresh(): void;
}

export function pixelArtEditor(
  tile: TileDef,
  onEdit: (patch: EditableTileFields) => void,
): PixelArtEditor {
  const state = initialPaintState(tile);
  const history = faceArtHistory(tile, onEdit);
  let strokeArt: CubeFaceArt | null = null;
  let clipboard: FacePixels | null = null;

  const canvas = pixelPaintCanvas({ onPaintPixel: handlePaint, onStrokeEnd: commitStroke });
  const tabs = faceTabs(state, { onSelect: selectFace, onToggleLink: toggleLinkedSides });
  const toolbar = paintToolbar(state, {
    onStateChange: refresh,
    onUndo: undo,
    onCopyFace: copyFace,
    onPasteFace: pasteFace,
    onClearFace: clearFace,
  });
  const tiling = tilingTools(shiftFace);
  const resolution = resolutionSelect(changeResolution);
  const root = assembleEditorPanel(tabs.root, canvas.canvas, toolbar.root, resolution.root, tiling.root);

  function refresh(): void {
    state.size = strokeArt?.size ?? tile.faceArt?.size ?? state.size;
    tabs.refresh();
    toolbar.refresh();
    resolution.refresh(state.size);
    const pixels = activeFacePixels();
    canvas.redraw(pixels, tile.color);
    tiling.refreshPreview(pixels, tile.color);
  }

  function activeFacePixels(): FacePixels {
    const art = strokeArt ?? tile.faceArt;
    return art ? art[activeFace(state)] : blankFacePixels(state.size);
  }

  function editableArt(): CubeFaceArt {
    return tile.faceArt ? cloneCubeFaceArt(tile.faceArt) : blankCubeFaceArt(state.size);
  }

  function selectFace(tab: FaceTab): void {
    state.faceTab = tab;
    refresh();
  }

  function toggleLinkedSides(): void {
    state.linkedSides = !state.linkedSides;
    if (state.linkedSides) relinkSides();
    else if (state.faceTab === 'sides') state.faceTab = 'north';
    refresh();
  }

  function relinkSides(): void {
    const source = isSideTab(state.faceTab) ? activeFace(state) : 'north';
    if (isSideTab(state.faceTab)) state.faceTab = 'sides';
    if (tile.faceArt && !sideFacesMatch(tile.faceArt)) {
      history.commit(copyFaceToAllSides(tile.faceArt, source));
    }
  }

  function handlePaint(index: number, phase: StrokePhase): void {
    if (state.tool === 'pick') return void (phase === 'start' && pickColorAt(index));
    if (state.tool === 'fill') return void (phase === 'start' && fillAt(index));
    strokePaintAt(index);
  }

  function strokePaintAt(index: number): void {
    strokeArt ??= editableArt();
    const value = state.tool === 'erase' ? null : state.paintColor;
    for (const face of targetFaces(state))
      for (const mirrored of mirroredPixelIndices(index, state.size, state.mirrorX, state.mirrorY))
        strokeArt[face][mirrored] = value;
    refresh();
  }

  function commitStroke(): void {
    if (!strokeArt) return;
    const stroked = strokeArt;
    strokeArt = null;
    history.commit(stroked);
    refresh();
  }

  function pickColorAt(index: number): void {
    state.paintColor = tile.faceArt?.[activeFace(state)][index] ?? tile.color;
    state.tool = 'draw';
    refresh();
  }

  function fillAt(index: number): void {
    commitToTargetFaces((pixels) =>
      floodFillFacePixels(pixels, state.size, index, state.paintColor),
    );
  }

  function clearFace(): void {
    commitToTargetFaces(() => blankFacePixels(state.size));
  }

  function shiftFace(dx: number, dy: number): void {
    if (!tile.faceArt) return;
    commitToTargetFaces((pixels) => shiftFacePixelsWithWrap(pixels, state.size, dx, dy));
  }

  function copyFace(): void {
    clipboard = [...activeFacePixels()];
  }

  function pasteFace(): void {
    if (!clipboard) return;
    const pixels = resampleFacePixels(clipboard, faceGridSize(clipboard), state.size);
    commitToTargetFaces(() => [...pixels]);
  }

  function commitToTargetFaces(transform: (pixels: FacePixels) => FacePixels): void {
    const art = editableArt();
    for (const face of targetFaces(state)) art[face] = transform(art[face]);
    history.commit(art);
    refresh();
  }

  function changeResolution(size: number): void {
    if (tile.faceArt) history.commit(resizeCubeFaceArt(tile.faceArt, size));
    state.size = size;
    refresh();
  }

  function undo(): void {
    history.undo();
    refresh();
  }

  refresh();
  return { root, refresh };
}

function assembleEditorPanel(
  tabs: HTMLElement,
  canvas: HTMLElement,
  toolbar: HTMLElement,
  resolution: HTMLElement,
  tiling: HTMLElement,
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'pixel-editor';
  const footer = document.createElement('div');
  footer.className = 'pixel-footer';
  footer.append(resolution, tiling);
  root.append(tabs, canvas, toolbar, footer);
  return root;
}
