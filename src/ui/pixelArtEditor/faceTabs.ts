import type { FaceTab, PaintState } from './paintState';

const LINKED_TABS: FaceTab[] = ['top', 'sides', 'bottom'];
const UNLINKED_TABS: FaceTab[] = ['top', 'north', 'east', 'south', 'west', 'bottom'];
const TAB_LABELS: Record<FaceTab, string> = {
  top: 'top',
  sides: 'sides',
  bottom: 'bottom',
  north: 'N',
  east: 'E',
  south: 'S',
  west: 'W',
};

export type FaceTabsCallbacks = {
  onSelect(tab: FaceTab): void;
  onToggleLink(): void;
};

export function faceTabs(
  state: PaintState,
  callbacks: FaceTabsCallbacks,
): { root: HTMLElement; refresh(): void } {
  const root = document.createElement('div');
  root.className = 'pixel-tabs';
  const refresh = () => root.replaceChildren(...tabButtons(state, callbacks));
  refresh();
  return { root, refresh };
}

function tabButtons(state: PaintState, callbacks: FaceTabsCallbacks): HTMLElement[] {
  const tabs = state.linkedSides ? LINKED_TABS : UNLINKED_TABS;
  return [
    ...tabs.map((tab) => faceTabButton(tab, state, callbacks)),
    linkSidesButton(state, callbacks),
  ];
}

function faceTabButton(
  tab: FaceTab,
  state: PaintState,
  callbacks: FaceTabsCallbacks,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn pixel-tab';
  button.textContent = TAB_LABELS[tab];
  button.classList.toggle('active', state.faceTab === tab);
  button.addEventListener('click', () => callbacks.onSelect(tab));
  return button;
}

function linkSidesButton(state: PaintState, callbacks: FaceTabsCallbacks): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn pixel-tab pixel-link';
  button.textContent = '🔗';
  button.title = state.linkedSides
    ? 'sides are linked: unlink to paint N/E/S/W separately'
    : 'link sides: copy the current side to all four and edit them together';
  button.classList.toggle('active', state.linkedSides);
  button.addEventListener('click', () => callbacks.onToggleLink());
  return button;
}
