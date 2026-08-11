import { ChangeNotifier } from '@/features/app-shell/runtime/changeNotifier';

export class ChatComposerState {
  private opened = false;
  private readonly changed = new ChangeNotifier();

  readonly subscribe = this.changed.subscribe;

  isOpen = (): boolean => this.opened;

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.changed.emit();
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.changed.emit();
  }
}
