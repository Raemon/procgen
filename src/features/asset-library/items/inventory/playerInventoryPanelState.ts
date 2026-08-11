import { ChangeNotifier } from '@/features/app-shell/runtime/changeNotifier';

export class PlayerInventoryPanelState {
  private opened = false;
  private readonly changed = new ChangeNotifier();

  readonly subscribe = this.changed.subscribe;

  isOpen = (): boolean => this.opened;

  toggle(): void {
    this.setOpen(!this.opened);
  }

  close(): void {
    this.setOpen(false);
  }

  private setOpen(open: boolean): void {
    if (this.opened === open) return;
    this.opened = open;
    this.changed.emit();
  }
}
