import { ChangeNotifier } from '@/features/app-shell/runtime/changeNotifier';

const MAX_REMEMBERED_BLOWS = 5;

export interface CombatNotice {
  id: number;
  text: string;
}

export class CombatFeed {
  private notices: CombatNotice[] = [];
  private nextId = 0;
  private readonly changed = new ChangeNotifier();

  readonly subscribe = this.changed.subscribe;

  recent = (): readonly CombatNotice[] => this.notices;

  announce(text: string): void {
    this.notices = [...this.notices, { id: this.nextId++, text }].slice(-MAX_REMEMBERED_BLOWS);
    this.changed.emit();
  }

  forget(notice: CombatNotice): void {
    this.notices = this.notices.filter((kept) => kept.id !== notice.id);
    this.changed.emit();
  }
}
