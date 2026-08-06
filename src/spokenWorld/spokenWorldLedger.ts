export class SpokenWorldLedger {
  private readonly openedVaults = new Set<string>();
  private readonly listeners = new Set<() => void>();

  isVaultOpen(x: number, y: number): boolean {
    return this.openedVaults.has(vaultKey(x, y));
  }

  openVault(x: number, y: number): boolean {
    if (this.isVaultOpen(x, y)) return false;
    this.openedVaults.add(vaultKey(x, y));
    this.listeners.forEach((listener) => listener());
    return true;
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function vaultKey(x: number, y: number): string {
  return `${x},${y}`;
}
