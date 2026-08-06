const NAME_STORAGE_KEY = 'procgen.playerName.v1';

export function playerName(): string {
  const existing = localStorage.getItem(NAME_STORAGE_KEY);
  if (existing) return existing;
  const generated = 'wanderer-' + Math.random().toString(36).slice(2, 6);
  localStorage.setItem(NAME_STORAGE_KEY, generated);
  return generated;
}
