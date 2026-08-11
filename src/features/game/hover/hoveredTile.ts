import { ChangeNotifier } from '@/features/app-shell/runtime/changeNotifier';

export interface HoveredCell {
  x: number;
  y: number;
}

export class HoveredTile {
  private cell: HoveredCell | null = null;
  private readonly changed = new ChangeNotifier();

  readonly subscribe = this.changed.subscribe;

  current = (): HoveredCell | null => this.cell;

  hover(cell: HoveredCell): void {
    if (this.cell?.x === cell.x && this.cell?.y === cell.y) return;
    this.cell = cell;
    this.changed.emit();
  }

  clear(): void {
    if (this.cell === null) return;
    this.cell = null;
    this.changed.emit();
  }
}
