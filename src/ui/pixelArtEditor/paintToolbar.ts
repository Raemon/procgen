import type { PaintState, PaintTool } from './paintState';

const TOOLS: { tool: PaintTool; label: string; title: string }[] = [
  { tool: 'draw', label: 'draw', title: 'paint pixels with the current color' },
  { tool: 'erase', label: 'erase', title: 'reset pixels to the base tile color' },
  { tool: 'fill', label: 'fill', title: 'flood-fill a region with the current color' },
  { tool: 'pick', label: 'pick', title: 'pick a color from the canvas' },
];

export type PaintToolbarCallbacks = {
  onStateChange(): void;
  onUndo(): void;
  onCopyFace(): void;
  onPasteFace(): void;
  onClearFace(): void;
};

export function paintToolbar(
  state: PaintState,
  callbacks: PaintToolbarCallbacks,
): { root: HTMLElement; refresh(): void } {
  const color = paintColorInput(state, callbacks);
  const stateful = statefulButtons(state, callbacks);
  const root = document.createElement('div');
  root.append(
    toolRow(color, ...stateful.tools),
    toolRow(...stateful.mirrors, ...actionButtons(callbacks)),
  );
  const refresh = () => {
    color.value = state.paintColor;
    stateful.refresh();
  };
  return { root, refresh };
}

function toolRow(...children: HTMLElement[]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'pixel-tools';
  row.append(...children);
  return row;
}

function paintColorInput(state: PaintState, callbacks: PaintToolbarCallbacks): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'color';
  input.value = state.paintColor;
  input.title = 'paint color';
  input.addEventListener('input', () => {
    state.paintColor = input.value;
    callbacks.onStateChange();
  });
  return input;
}

function statefulButtons(
  state: PaintState,
  callbacks: PaintToolbarCallbacks,
): { tools: HTMLButtonElement[]; mirrors: HTMLButtonElement[]; refresh(): void } {
  const tools = TOOLS.map((spec) => toolButton(spec, state, callbacks));
  const mirrors = [mirrorButton('x', state, callbacks), mirrorButton('y', state, callbacks)];
  const refresh = () => {
    TOOLS.forEach((spec, i) => tools[i]!.classList.toggle('active', state.tool === spec.tool));
    mirrors[0]!.classList.toggle('active', state.mirrorX);
    mirrors[1]!.classList.toggle('active', state.mirrorY);
  };
  return { tools, mirrors, refresh };
}

function toolButton(
  spec: (typeof TOOLS)[number],
  state: PaintState,
  callbacks: PaintToolbarCallbacks,
): HTMLButtonElement {
  return smallButton(spec.label, spec.title, () => {
    state.tool = spec.tool;
    callbacks.onStateChange();
  });
}

function mirrorButton(
  axis: 'x' | 'y',
  state: PaintState,
  callbacks: PaintToolbarCallbacks,
): HTMLButtonElement {
  const title =
    axis === 'x' ? 'mirror strokes left↔right' : 'mirror strokes top↕bottom';
  return smallButton(`mir ${axis}`, title, () => {
    if (axis === 'x') state.mirrorX = !state.mirrorX;
    else state.mirrorY = !state.mirrorY;
    callbacks.onStateChange();
  });
}

function actionButtons(callbacks: PaintToolbarCallbacks): HTMLButtonElement[] {
  return [
    smallButton('undo', 'undo the last edit', callbacks.onUndo),
    smallButton('copy', 'copy this face', callbacks.onCopyFace),
    smallButton('paste', 'paste the copied face here', callbacks.onPasteFace),
    smallButton('clear', 'reset this face to the base color', callbacks.onClearFace),
  ];
}

function smallButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.textContent = label;
  button.title = title;
  button.addEventListener('click', onClick);
  return button;
}
