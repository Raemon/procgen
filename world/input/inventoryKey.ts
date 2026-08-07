import type { PlayerInventoryPanelState } from '../../library/items/inventory/playerInventoryPanelState';
import { hasModifier, isTypingInFormControl } from './movementKeys';

const INVENTORY_KEY = 'KeyE';

export interface InventoryKeyDeps {
  panel: PlayerInventoryPanelState;
  isSuspended(): boolean;
}

export class InventoryKeyInput {
  constructor(private readonly deps: InventoryKeyDeps) {
    window.addEventListener('keydown', this.onKeyDown);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || isTypingInFormControl(event) || hasModifier(event)) return;
    if (event.code === 'Escape' || event.key === 'Escape') return this.deps.panel.close();
    if (event.code !== INVENTORY_KEY || this.deps.isSuspended()) return;
    event.preventDefault();
    this.deps.panel.toggle();
  };
}
