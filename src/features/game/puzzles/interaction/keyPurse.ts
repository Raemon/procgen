export interface KeyPurse {
  spendKey(): boolean;
}

export const NO_KEYS: KeyPurse = { spendKey: () => false };
