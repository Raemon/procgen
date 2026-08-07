export interface FakeLocalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function installFakeLocalStorage(): FakeLocalStorage {
  const entries = new Map<string, string>();
  const storage: FakeLocalStorage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    removeItem: (key) => void entries.delete(key),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  return storage;
}
