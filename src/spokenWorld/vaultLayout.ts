export const VAULT_WALL_RADIUS = 2;

export type VaultCell = 'wall' | 'door' | 'inside' | 'outside';

export function vaultCellAt(vaultX: number, vaultY: number, x: number, y: number): VaultCell {
  const dx = x - vaultX;
  const dy = y - vaultY;
  const ring = Math.max(Math.abs(dx), Math.abs(dy));
  if (ring > VAULT_WALL_RADIUS) return 'outside';
  if (ring < VAULT_WALL_RADIUS) return 'inside';
  return dx === 0 && dy === VAULT_WALL_RADIUS ? 'door' : 'wall';
}
