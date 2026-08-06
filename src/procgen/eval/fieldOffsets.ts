import { ChangeNotifier } from '../../app/changeNotifier';

export class FieldOffsets {
  private byNodeId = new Map<string, number>();
  private revisionCount = 0;
  private readonly changed = new ChangeNotifier();

  readonly onChange = this.changed.subscribe;

  revision(): number {
    return this.revisionCount;
  }

  offsetFor(nodeId: string): number {
    return this.byNodeId.get(nodeId) ?? 0;
  }

  active(): boolean {
    return this.byNodeId.size > 0;
  }

  all(): ReadonlyMap<string, number> {
    return this.byNodeId;
  }

  replaceAll(offsets: ReadonlyMap<string, number>): void {
    this.byNodeId = new Map([...offsets].filter(([, offset]) => offset !== 0));
    this.revisionCount++;
    this.changed.emit();
  }

  clear(): void {
    this.replaceAll(new Map());
  }
}

export const NO_FIELD_OFFSETS = new FieldOffsets();
