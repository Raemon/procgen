export function rememberedArt<T>(cache: Map<string, T>, key: string, paint: () => T): T {
  const known = cache.get(key);
  if (known) return known;
  const art = paint();
  cache.set(key, art);
  return art;
}
