import type { TileDef } from '../../world/tiles/tileDef';
import {
  blankCubeFaceArt,
  blankFacePixels,
  cloneCubeFaceArt,
  CUBE_FACES,
  isEntirelyBlank,
  type CubeFace,
  type CubeFaceArt,
} from '../../world/tiles/tileFaceArt';
import type { EditableTileFields } from '../../world/tiles/tileset';
import { pixelPaintCanvas } from './pixelPaintCanvas';

export interface PixelArtEditor {
  root: HTMLElement;
  refresh(): void;
}

interface PaintState {
  face: CubeFace;
  paintColor: string;
  erasing: boolean;
  strokeArt: CubeFaceArt | null;
}

export function pixelArtEditor(
  tile: TileDef,
  onEdit: (patch: EditableTileFields) => void,
): PixelArtEditor {
  const state: PaintState = {
    face: 'top',
    paintColor: tile.color,
    erasing: false,
    strokeArt: null,
  };

  const canvas = pixelPaintCanvas({ onPaintPixel: paintPixel, onStrokeEnd: commitStroke });
  const tabs = faceTabs(selectFace);
  const root = document.createElement('div');
  root.className = 'pixel-editor';
  root.append(tabs.root, canvas.canvas, paintTools(state, clearActiveFace));

  function refresh(): void {
    tabs.setActive(state.face);
    const art = state.strokeArt ?? tile.faceArt;
    canvas.redraw(art?.[state.face] ?? blankFacePixels(), tile.color);
  }

  function selectFace(face: CubeFace): void {
    state.face = face;
    refresh();
  }

  function paintPixel(index: number): void {
    state.strokeArt ??= editableCopyOfArt(tile);
    state.strokeArt[state.face][index] = state.erasing ? null : state.paintColor;
    refresh();
  }

  function commitStroke(): void {
    if (!state.strokeArt) return;
    commitArt(state.strokeArt);
    state.strokeArt = null;
  }

  function clearActiveFace(): void {
    const art = editableCopyOfArt(tile);
    art[state.face] = blankFacePixels();
    commitArt(art);
    refresh();
  }

  function commitArt(art: CubeFaceArt): void {
    onEdit({ faceArt: isEntirelyBlank(art) ? null : art });
  }

  refresh();
  return { root, refresh };
}

function editableCopyOfArt(tile: TileDef): CubeFaceArt {
  return tile.faceArt ? cloneCubeFaceArt(tile.faceArt) : blankCubeFaceArt();
}

function faceTabs(onSelect: (face: CubeFace) => void): {
  root: HTMLElement;
  setActive(face: CubeFace): void;
} {
  const root = document.createElement('div');
  root.className = 'pixel-tabs';
  const buttons = new Map<CubeFace, HTMLButtonElement>();
  for (const face of CUBE_FACES) {
    const button = faceTabButton(face, onSelect);
    buttons.set(face, button);
    root.appendChild(button);
  }
  return {
    root,
    setActive(face) {
      for (const [tabFace, button] of buttons) button.classList.toggle('active', tabFace === face);
    },
  };
}

function faceTabButton(face: CubeFace, onSelect: (face: CubeFace) => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn pixel-tab';
  button.textContent = face;
  button.addEventListener('click', () => onSelect(face));
  return button;
}

function paintTools(state: PaintState, onClearFace: () => void): HTMLElement {
  const root = document.createElement('div');
  root.className = 'pixel-tools';
  root.append(paintColorInput(state), eraseToggle(state), clearFaceButton(onClearFace));
  return root;
}

function paintColorInput(state: PaintState): HTMLElement {
  const input = document.createElement('input');
  input.type = 'color';
  input.value = state.paintColor;
  input.title = 'paint color';
  input.addEventListener('input', () => {
    state.paintColor = input.value;
  });
  return input;
}

function eraseToggle(state: PaintState): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.textContent = 'erase';
  button.title = 'paint pixels back to the base color';
  button.addEventListener('click', () => {
    state.erasing = !state.erasing;
    button.classList.toggle('active', state.erasing);
  });
  return button;
}

function clearFaceButton(onClearFace: () => void): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.textContent = 'clear';
  button.title = 'reset this face to the base color';
  button.addEventListener('click', onClearFace);
  return button;
}
