export class QuestInventory {
  private readonly keyIds = new Set<string>();

  has(keyId: string): boolean {
    return this.keyIds.has(keyId);
  }

  collect(keyId: string): boolean {
    if (this.keyIds.has(keyId)) return false;
    this.keyIds.add(keyId);
    return true;
  }

  keysHeld(): string[] {
    return [...this.keyIds].sort();
  }

  reset(): void {
    this.keyIds.clear();
  }
}
