import { elementById } from './appLayout';

export type ViewMode = 'ascii' | '3d';

export interface ViewModeSlots {
  ascii: HTMLElement;
  view3d: HTMLElement;
}

export class ViewModeToggle {
  private mode: ViewMode = 'ascii';
  private readonly asciiButton = elementById('btn-ascii');
  private readonly view3dButton = elementById('btn-3d');

  constructor(
    private readonly slots: ViewModeSlots,
    private readonly onAsciiShown: () => void,
  ) {
    this.asciiButton.addEventListener('click', () => this.show('ascii'));
    this.view3dButton.addEventListener('click', () => this.show('3d'));
    this.show('ascii');
  }

  current(): ViewMode {
    return this.mode;
  }

  private show(mode: ViewMode): void {
    this.mode = mode;
    this.slots.ascii.classList.toggle('hidden', mode !== 'ascii');
    this.slots.view3d.classList.toggle('hidden', mode !== '3d');
    this.asciiButton.classList.toggle('active', mode === 'ascii');
    this.view3dButton.classList.toggle('active', mode === '3d');
    if (mode === 'ascii') this.onAsciiShown();
  }
}
