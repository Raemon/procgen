import { ChangeNotifier } from '@/features/app-shell/runtime/changeNotifier';

const MAX_REMEMBERED_NOTICES = 4;

export interface PickupNotice {
  id: number;
  text: string;
  tone: 'taken' | 'refused';
}

export class PickupFeed {
  private notices: PickupNotice[] = [];
  private nextId = 0;
  private readonly changed = new ChangeNotifier();

  readonly subscribe = this.changed.subscribe;

  recent = (): readonly PickupNotice[] => this.notices;

  announceTaken(itemName: string): void {
    this.push(`picked up ${itemName}`, 'taken');
  }

  announceRefused(hint: string): void {
    this.push(hint, 'refused');
  }

  forget(notice: PickupNotice): void {
    this.notices = this.notices.filter((kept) => kept.id !== notice.id);
    this.changed.emit();
  }

  private push(text: string, tone: PickupNotice['tone']): void {
    this.notices = [...this.notices, { id: this.nextId++, text, tone }].slice(
      -MAX_REMEMBERED_NOTICES,
    );
    this.changed.emit();
  }
}
